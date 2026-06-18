from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import InternalAsset, LogAction, Report, ReportStatus, User
from app.services.audit_service import log_ai_event
from app.tools.impact_tools import inspect_deployment_tool


def assess_report_impact(
    db: Session,
    user: User,
    report: Report,
    service_name: str | None = None,
) -> Report:
    asset_name = service_name
    if not asset_name:
        asset = db.query(InternalAsset).order_by(InternalAsset.id.asc()).first()
        if not asset:
            raise HTTPException(status_code=400, detail="No internal assets seeded")
        asset_name = asset.service_name

    tool_output = inspect_deployment_tool(asset_name)
    response = (
        f"Impact assessment for {report.cve_id or report.title} against {asset_name}:\n"
        f"{tool_output}"
    )
    report.assessment_result = response
    report.status = ReportStatus.assessed
    db.commit()
    db.refresh(report)
    log_ai_event(
        db,
        action=LogAction.assess_impact,
        user_id=user.id,
        report_id=report.id,
        prompt=f"Assess impact for {report.cve_id or report.title}",
        retrieved_context=report.content,
        tool_name="inspect_deployment",
        tool_input={"service_name": asset_name},
        tool_output=tool_output,
        response=response,
    )
    return report
