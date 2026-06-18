import enum
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class UserRole(str, enum.Enum):
    user = "user"
    admin = "admin"


class SeverityLevel(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class ReportStatus(str, enum.Enum):
    uploaded = "uploaded"
    indexed = "indexed"
    summarized = "summarized"
    assessed = "assessed"


class LogAction(str, enum.Enum):
    chat = "chat"
    summarize = "summarize"
    fetch_url = "fetch_url"
    assess_impact = "assess_impact"
    mcp_call = "mcp_call"
    login = "login"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(UserRole, native_enum=False), nullable=False, default=UserRole.user)
    display_name = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login_at = Column(DateTime)

    reports = relationship("Report", back_populates="owner")
    notes = relationship("PrivateNote", back_populates="owner")


class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    session_id = Column(String, unique=True, nullable=False, index=True)
    user_agent = Column(Text)
    ip_address = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)

    user = relationship("User")


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    cve_id = Column(String, index=True)
    severity = Column(Enum(SeverityLevel, native_enum=False))
    description = Column(Text)
    content = Column(Text, nullable=False)
    source_url = Column(Text)
    summary = Column(Text)
    assessment_result = Column(Text)
    status = Column(Enum(ReportStatus, native_enum=False), default=ReportStatus.uploaded)
    rag_indexed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", back_populates="reports")
    chunks = relationship("RagChunk", cascade="all, delete-orphan", back_populates="report")


class RagChunk(Base):
    __tablename__ = "rag_chunks"

    id = Column(Integer, primary_key=True)
    report_id = Column(Integer, ForeignKey("reports.id"), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    cve_id = Column(String, index=True)
    chunk_index = Column(Integer)
    chunk_text = Column(Text, nullable=False)
    embedding_id = Column(String)
    metadata_json = Column("metadata", JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

    report = relationship("Report", back_populates="chunks")


class PrivateNote(Base):
    __tablename__ = "private_notes"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String)
    note_content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", back_populates="notes")


class InternalAsset(Base):
    __tablename__ = "internal_assets"

    id = Column(Integer, primary_key=True)
    service_name = Column(String, unique=True, nullable=False, index=True)
    service_type = Column(String)
    version = Column(String)
    host = Column(String)
    port = Column(Integer)
    status = Column(String)
    runtime_metadata = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)


class AiAuditLog(Base):
    __tablename__ = "ai_audit_logs"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    report_id = Column(Integer, ForeignKey("reports.id"))
    action = Column(Enum(LogAction, native_enum=False), nullable=False)
    prompt = Column(Text)
    retrieved_context = Column(Text)
    tool_name = Column(String)
    tool_input = Column(JSON)
    tool_output = Column(Text)
    response = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
