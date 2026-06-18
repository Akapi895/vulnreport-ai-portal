from sqlalchemy.orm import Session

from app.models import Report
from app.services.llm_service import complete
from app.services.rag_service import search_reports


def summarize_report(report: Report) -> str:
    prompt = f"""
You are VulnReport AI. Summarize this vulnerability report clearly.

Report title: {report.title}
CVE ID: {report.cve_id or "N/A"}
Severity: {report.severity.value if report.severity else "N/A"}
Description: {report.description or ""}

Report content:
{report.content}

Return:
- CVE summary
- Affected component/version
- Impact
- Suggested mitigation
"""
    return complete(prompt)


def search_reports_tool(db: Session, query: str) -> str:
    return search_reports(db, query)
