import re
from typing import Any
from urllib.parse import urlparse

from sqlalchemy.orm import Session

from app.config import settings
from app.models import RagChunk, Report, ReportStatus
from app.rag.chunker import semantic_chunk
from app.rag.embedder import get_embedding_service
from app.rag.retriever import VectorRetriever


class RAGService:
    def __init__(self, retriever: VectorRetriever | None = None) -> None:
        self.chunk_size = settings.rag_chunk_size
        self.chunk_overlap = settings.rag_chunk_overlap
        self.embedding = get_embedding_service()
        self.retriever = retriever or VectorRetriever()

    def index_report(self, db: Session, report: Report) -> None:
        self.retriever.delete_report(report.id)
        for old_chunk in list(report.chunks):
            db.delete(old_chunk)

        vector_docs: list[dict] = []
        for index, text in enumerate(semantic_chunk(report.content, self.chunk_size, self.chunk_overlap)):
            embedding = self.embedding.embed_text(text)
            chunk_id = f"report-{report.id}-chunk-{index}"
            metadata = {
                "report_id": report.id,
                "owner_id": report.owner_id,
                "cve_id": _normalize_cve_id(report.cve_id),
                "chunk_index": index,
                "title": report.title,
                "source_url": report.source_url or "",
                "severity": report.severity.value if report.severity else "",
                "trust_label": _trust_label(report),
            }
            db.add(
                RagChunk(
                    report_id=report.id,
                    owner_id=report.owner_id,
                    cve_id=report.cve_id,
                    chunk_index=index,
                    chunk_text=text,
                    embedding_id=chunk_id,
                    metadata_json=metadata,
                )
            )
            vector_docs.append(
                {
                    "id": chunk_id,
                    "content": text,
                    "embedding": embedding,
                    "metadata": metadata,
                }
            )

        self.retriever.upsert_chunks(vector_docs)
        report.rag_indexed = True
        report.status = ReportStatus.indexed
        db.commit()

    def search_reports(self, db: Session, query: str, limit: int = 5) -> str:
        chunks = self.search_report_chunks(db, query, limit=limit)
        return "\n\n".join(_format_chunk(chunk) for chunk in chunks)

    def search_report_chunks(self, db: Session, query: str, limit: int = 5) -> list[dict[str, Any]]:
        where = None
        fetch_k = limit
        cve_id = _extract_cve_id(query)
        should_prioritize_untrusted = bool(cve_id and settings.lab_mode and settings.enable_vuln_rag_poisoning)
        if not (settings.lab_mode and settings.enable_vuln_rag_poisoning):
            where = {"trust_label": "clean"}
            fetch_k = max(limit * settings.rag_search_pool_multiplier, limit)
        if cve_id:
            where = _and_where(where, {"cve_id": cve_id})
            fetch_k = max(limit * settings.rag_search_pool_multiplier, limit)

        query_embedding = self.embedding.embed_text(query)
        chunks = self.retriever.query(
            query_embedding=query_embedding,
            limit=fetch_k,
            where=where,
            fetch_k=fetch_k,
        )
        if should_prioritize_untrusted:
            chunks = _prioritize_untrusted_chunks(chunks)
        return chunks[:limit]


def _format_chunk(chunk: dict) -> str:
    metadata = chunk.get("metadata") or {}
    title = metadata.get("title") or "untitled"
    report_id = metadata.get("report_id", "")
    cve_id = metadata.get("cve_id", "")
    return f"[report_id={report_id} title={title} cve={cve_id}] {chunk.get('content', '')}"


def format_chunks(chunks: list[dict[str, Any]]) -> str:
    return "\n\n".join(_format_chunk(chunk) for chunk in chunks)


def _extract_cve_id(query: str) -> str | None:
    match = re.search(r"\bCVE-\d{4}-\d{4,}\b", query or "", flags=re.IGNORECASE)
    return match.group(0).upper() if match else None


def _normalize_cve_id(cve_id: str | None) -> str:
    return cve_id.upper() if cve_id else ""


def _and_where(left: dict | None, right: dict) -> dict:
    if not left:
        return right
    return {"$and": [left, right]}


def _prioritize_untrusted_chunks(chunks: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return sorted(
        chunks,
        key=lambda chunk: (
            (chunk.get("metadata") or {}).get("trust_label") != "untrusted",
            chunk.get("distance") if chunk.get("distance") is not None else 1,
        ),
    )


def _trust_label(report: Report) -> str:
    if not report.source_url:
        return "untrusted"

    trusted_hosts = {
        "apache.org",
        "cwiki.apache.org",
        "nvd.nist.gov",
        "cve.org",
        "github.com",
    }
    host = (urlparse(report.source_url).hostname or "").lower()
    if host in trusted_hosts or any(host.endswith(f".{trusted}") for trusted in trusted_hosts):
        return "clean"
    return "untrusted"


_rag_service: RAGService | None = None


def get_rag_service() -> RAGService:
    global _rag_service
    if _rag_service is None:
        _rag_service = RAGService()
    return _rag_service
