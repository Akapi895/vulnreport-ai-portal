from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import AiAuditLog, InternalAsset, Report, User
from app.schemas import AuditLogOut, ReportOut, UserOut
from app.security import require_admin


router = APIRouter()


@router.get("/flag")
def get_flag(admin=Depends(require_admin)):
    with open("/app/flags/admin_flag.txt", "r", encoding="utf-8") as flag_file:
        return {"flag": flag_file.read().strip()}


@router.get("/users", response_model=list[UserOut])
def users(db: Session = Depends(get_db), admin=Depends(require_admin)):
    return db.query(User).order_by(User.id.asc()).all()


@router.get("/reports", response_model=list[ReportOut])
def reports(db: Session = Depends(get_db), admin=Depends(require_admin)):
    return db.query(Report).order_by(Report.id.desc()).all()


@router.get("/audit-logs", response_model=list[AuditLogOut])
def audit_logs(db: Session = Depends(get_db), admin=Depends(require_admin)):
    return db.query(AiAuditLog).order_by(AiAuditLog.id.desc()).limit(200).all()


@router.get("/status")
def status(db: Session = Depends(get_db), admin=Depends(require_admin)):
    return {
        "lab_mode": settings.lab_mode,
        "vuln_flags": {
            "note_idor": settings.enable_vuln_note_idor,
            "fetch_header_forward": settings.enable_vuln_fetch_header_forward,
            "mcp_secret_leak": settings.enable_vuln_mcp_secret_leak,
            "rag_poisoning": settings.enable_vuln_rag_poisoning,
        },
        "users": db.query(User).count(),
        "reports": db.query(Report).count(),
        "internal_assets": db.query(InternalAsset).count(),
    }
