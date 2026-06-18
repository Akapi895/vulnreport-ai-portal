from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr

from app.models import LogAction, ReportStatus, SeverityLevel, UserRole


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    display_name: str | None = None


class LoginRequest(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: str
    role: UserRole
    display_name: str | None = None
    created_at: datetime | None = None
    last_login_at: datetime | None = None


class ReportCreate(BaseModel):
    title: str
    cve_id: str | None = None
    severity: SeverityLevel | None = None
    description: str | None = None
    content: str
    source_url: str | None = None


class ReportOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: int
    title: str
    cve_id: str | None = None
    severity: SeverityLevel | None = None
    description: str | None = None
    content: str
    source_url: str | None = None
    summary: str | None = None
    assessment_result: str | None = None
    status: ReportStatus
    rag_indexed: bool
    created_at: datetime | None = None
    updated_at: datetime | None = None


class NoteCreate(BaseModel):
    title: str | None = None
    note_content: str


class NoteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: int
    title: str | None = None
    note_content: str
    created_at: datetime | None = None
    updated_at: datetime | None = None


class ChatRequest(BaseModel):
    prompt: str


class CveRequest(BaseModel):
    cve_id: str
    prompt: str | None = None


class FetchUrlRequest(BaseModel):
    url: str


class AssessImpactRequest(BaseModel):
    service_name: str | None = None


class AiResponse(BaseModel):
    response: str
    retrieved_context: str | None = None
    tool_name: str | None = None
    tool_input: Any | None = None
    tool_output: str | None = None


class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int | None = None
    report_id: int | None = None
    action: LogAction
    prompt: str | None = None
    retrieved_context: str | None = None
    tool_name: str | None = None
    tool_input: dict[str, Any] | None = None
    tool_output: str | None = None
    response: str | None = None
    created_at: datetime | None = None
