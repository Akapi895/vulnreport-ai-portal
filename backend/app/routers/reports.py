from fastapi import APIRouter, Depends, File, Form, Request, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import SeverityLevel
from app.schemas import AssessImpactRequest, ReportCreate, ReportOut
from app.security import get_current_user
from app.services import report_service
from app.services.agent_service import summarize_report
from app.services.impact_service import assess_report_impact
from app.utils.file_parser import parse_upload_file


router = APIRouter()


@router.post("", response_model=ReportOut)
def upload_report(
    payload: ReportCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    return report_service.create_report(db, user, payload)


@router.post("/upload-file", response_model=ReportOut)
async def upload_report_file(
    title: str = Form(...),
    cve_id: str | None = Form(default=None),
    severity: SeverityLevel | None = Form(default=None),
    description: str | None = Form(default=None),
    source_url: str | None = Form(default=None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    content = await parse_upload_file(file)
    payload = ReportCreate(
        title=title,
        cve_id=cve_id,
        severity=severity,
        description=description,
        content=content,
        source_url=source_url,
    )
    return report_service.create_report_from_content(db, user, payload, content)


@router.get("", response_model=list[ReportOut])
def list_reports(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return report_service.list_my_reports(db, user)


@router.get("/{report_id}", response_model=ReportOut)
def view_report(report_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    return report_service.get_owned_report(db, user, report_id)


@router.delete("/{report_id}")
def delete_report(report_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    report_service.delete_owned_report(db, user, report_id)
    return {"status": "deleted"}


@router.post("/{report_id}/summarize", response_model=ReportOut)
def summarize(
    report_id: int,
    request: Request,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    report = report_service.get_owned_report(db, user, report_id)
    result = summarize_report(db, user, report, request.headers)
    return report_service.save_summary(db, report, result["response"])


@router.post("/{report_id}/assess-impact", response_model=ReportOut)
def assess_impact(
    report_id: int,
    payload: AssessImpactRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    report = report_service.get_owned_report(db, user, report_id)
    return assess_report_impact(db, user, report, payload.service_name)
