from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Report, ReportStatus, User
from app.schemas import ReportCreate
from app.services.rag_service import index_report
from app.utils.logger import get_logger


logger = get_logger(__name__)


def create_report(db: Session, owner: User, payload: ReportCreate) -> Report:
    report = Report(owner_id=owner.id, **payload.model_dump())
    db.add(report)
    db.commit()
    db.refresh(report)
    index_report(db, report)
    logger.info("Report indexed successfully: report_id=%s", report.id)
    db.refresh(report)
    return report


def create_report_from_content(
    db: Session,
    owner: User,
    payload: ReportCreate,
    content: str,
) -> Report:
    report_data = payload.model_dump()
    report_data["content"] = content
    report = Report(owner_id=owner.id, **report_data)
    db.add(report)
    db.commit()
    db.refresh(report)
    index_report(db, report)
    logger.info("Report indexed successfully: report_id=%s", report.id)
    db.refresh(report)
    return report


def list_my_reports(db: Session, owner: User) -> list[Report]:
    return db.query(Report).filter(Report.owner_id == owner.id).order_by(Report.id.desc()).all()


def get_owned_report(db: Session, owner: User, report_id: int) -> Report:
    report = db.query(Report).filter(Report.id == report_id, Report.owner_id == owner.id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    return report


def delete_owned_report(db: Session, owner: User, report_id: int) -> None:
    report = get_owned_report(db, owner, report_id)
    db.delete(report)
    db.commit()


def save_summary(db: Session, report: Report, summary: str) -> Report:
    report.summary = summary
    report.status = ReportStatus.summarized
    db.commit()
    db.refresh(report)
    return report
