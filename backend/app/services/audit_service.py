from typing import Any

from sqlalchemy.orm import Session

from app.models import AiAuditLog, LogAction


def log_ai_event(
    db: Session,
    action: LogAction,
    user_id: int | None = None,
    report_id: int | None = None,
    prompt: str | None = None,
    retrieved_context: str | None = None,
    tool_name: str | None = None,
    tool_input: dict[str, Any] | None = None,
    tool_output: str | None = None,
    response: str | None = None,
) -> AiAuditLog:
    log = AiAuditLog(
        user_id=user_id,
        report_id=report_id,
        action=action,
        prompt=prompt,
        retrieved_context=retrieved_context,
        tool_name=tool_name,
        tool_input=tool_input,
        tool_output=tool_output,
        response=response,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log
