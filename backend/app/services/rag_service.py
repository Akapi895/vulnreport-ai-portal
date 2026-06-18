from sqlalchemy.orm import Session

from app.models import Report
from app.rag.service import format_chunks, get_rag_service


def index_report(db: Session, report: Report) -> None:
    get_rag_service().index_report(db, report)


def search_reports(db: Session, query: str, limit: int = 5) -> str:
    return get_rag_service().search_reports(db, query, limit=limit)


def search_report_chunks(db: Session, query: str, limit: int = 5) -> list[dict]:
    return get_rag_service().search_report_chunks(db, query, limit=limit)


def format_report_chunks(chunks: list[dict]) -> str:
    return format_chunks(chunks)
