import re
import json
from typing import Any

from sqlalchemy.orm import Session

from app.models import LogAction, Report, User
from app.services.audit_service import log_ai_event
from app.services.llm_service import complete
from app.services.rag_service import format_report_chunks, search_report_chunks
from app.tools.fetch_tools import fetch_url
from app.tools.note_tools import get_private_note
from app.tools.report_tools import summarize_report as basic_summary


NOTE_ID_PATTERN = re.compile(r"(?:note[_\s-]?id|note)\D+(\d+)", re.IGNORECASE)
URL_PATTERN = re.compile(r"https?://[^\s'\"<>)]+", re.IGNORECASE)


# MVP lab planner: rule-based tool selection that simulates agent tool-calling.
def _tool_result_payload(
    response: str,
    retrieved_context: str | None = None,
    tool_name: str | None = None,
    tool_input: dict[str, Any] | None = None,
    tool_output: str | None = None,
) -> dict[str, Any]:
    return {
        "response": response,
        "retrieved_context": retrieved_context,
        "tool_name": tool_name,
        "tool_input": tool_input,
        "tool_output": tool_output,
    }


def chat(db: Session, user: User, prompt: str, original_headers) -> dict[str, Any]:
    retrieved_chunks = search_report_chunks(db, prompt)
    retrieved_context = format_report_chunks(retrieved_chunks)
    retrieved_context_log = _chunks_for_audit(retrieved_chunks)

    note_match = NOTE_ID_PATTERN.search(prompt)
    if note_match:
        note_id = int(note_match.group(1))
        tool_output = get_private_note(db, user, note_id)
        response = f"Tool result: {tool_output}"
        log_ai_event(
            db,
            action=LogAction.chat,
            user_id=user.id,
            prompt=prompt,
            retrieved_context=retrieved_context_log,
            tool_name="get_private_note",
            tool_input={"note_id": note_id},
            tool_output=tool_output,
            response=response,
        )
        return _tool_result_payload(response, retrieved_context, "get_private_note", {"note_id": note_id}, tool_output)

    context_url = URL_PATTERN.search(retrieved_context or "")
    if context_url:
        url = context_url.group(0).rstrip(".,);]")
        tool_output = fetch_url(url, original_headers)
        response = f"Fetched URL requested by retrieved context: {tool_output}"
        log_ai_event(
            db,
            action=LogAction.fetch_url,
            user_id=user.id,
            prompt=prompt,
            retrieved_context=retrieved_context_log,
            tool_name="fetch_url",
            tool_input={"url": url},
            tool_output=tool_output,
            response=response,
        )
        return _tool_result_payload(response, retrieved_context, "fetch_url", {"url": url}, tool_output)

    llm_prompt = f"User question:\n{prompt}\n\nRetrieved context:\n{retrieved_context}"
    response = complete(llm_prompt)
    log_ai_event(
        db,
        action=LogAction.chat,
        user_id=user.id,
        prompt=prompt,
        retrieved_context=retrieved_context_log,
        response=response,
    )
    return _tool_result_payload(response, retrieved_context)


def summarize_report(db: Session, user: User, report: Report, original_headers) -> dict[str, Any]:
    retrieved_chunks = search_report_chunks(db, report.cve_id or report.title)
    retrieved_context = format_report_chunks(retrieved_chunks)
    retrieved_context_log = _chunks_for_audit(retrieved_chunks)
    context_url = URL_PATTERN.search(retrieved_context or "")
    if context_url:
        url = context_url.group(0).rstrip(".,);]")
        tool_output = fetch_url(url, original_headers)
        response = f"{basic_summary(report)}\n\nFetched advisory: {tool_output}"
        log_ai_event(
            db,
            action=LogAction.summarize,
            user_id=user.id,
            report_id=report.id,
            prompt=f"summarize {report.cve_id or report.title}",
            retrieved_context=retrieved_context_log,
            tool_name="fetch_url",
            tool_input={"url": url},
            tool_output=tool_output,
            response=response,
        )
        return _tool_result_payload(response, retrieved_context, "fetch_url", {"url": url}, tool_output)

    response = basic_summary(report)
    log_ai_event(
        db,
        action=LogAction.summarize,
        user_id=user.id,
        report_id=report.id,
        prompt=f"summarize {report.cve_id or report.title}",
        retrieved_context=retrieved_context_log,
        response=response,
    )
    return _tool_result_payload(response, retrieved_context)


def summarize_cve(db: Session, user: User, cve_id: str, prompt: str | None, original_headers) -> dict[str, Any]:
    return chat(db, user, prompt or f"Summarize {cve_id}", original_headers)


def _chunks_for_audit(chunks: list[dict[str, Any]]) -> str:
    audit_chunks = [
        {
            "id": chunk.get("id"),
            "metadata": chunk.get("metadata") or {},
            "distance": chunk.get("distance"),
            "content": chunk.get("content"),
        }
        for chunk in chunks
    ]
    return json.dumps(audit_chunks, ensure_ascii=True)
