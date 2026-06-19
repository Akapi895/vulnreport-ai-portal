import os
from dataclasses import dataclass


def _bool_env(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Settings:
    database_url: str = os.getenv(
        "DATABASE_URL",
        "postgresql://vulnapp:vulnpass123@postgres:5432/vulnreport",
    )
    llm_url: str = os.getenv("LLM_URL", "http://llm-gateway:11434")
    llm_model: str = os.getenv("LLM_MODEL", "qwen2.5")
    llm_timeout_seconds: int = int(os.getenv("LLM_TIMEOUT_SECONDS", "120"))
    cors_origins: str = os.getenv(
        "CORS_ORIGINS",
        "http://localhost,http://localhost:5173",
    )
    mcp_url: str = os.getenv("MCP_URL", "http://mcp-server:9001")
    chroma_host: str = os.getenv("CHROMA_HOST", "vector-db")
    chroma_port: int = int(os.getenv("CHROMA_PORT", "8000"))
    chroma_collection: str = os.getenv("CHROMA_COLLECTION", "vulnreport_reports")
    embedding_model: str = os.getenv("EMBEDDING_MODEL", "nomic-embed-text")
    rag_chunk_size: int = int(os.getenv("RAG_CHUNK_SIZE", "900"))
    rag_chunk_overlap: int = int(os.getenv("RAG_CHUNK_OVERLAP", "120"))
    rag_search_pool_multiplier: int = int(os.getenv("RAG_SEARCH_POOL_MULTIPLIER", "4"))
    lab_mode: bool = _bool_env("LAB_MODE", True)
    enable_vuln_note_idor: bool = _bool_env("ENABLE_VULN_NOTE_IDOR", True)
    enable_vuln_fetch_header_forward: bool = _bool_env(
        "ENABLE_VULN_FETCH_HEADER_FORWARD", True
    )
    enable_vuln_mcp_secret_leak: bool = _bool_env(
        "ENABLE_VULN_MCP_SECRET_LEAK", True
    )
    enable_vuln_rag_poisoning: bool = _bool_env(
        "ENABLE_VULN_RAG_POISONING", True
    )
    auto_seed: bool = _bool_env("AUTO_SEED", True)
    session_cookie_name: str = os.getenv("SESSION_COOKIE_NAME", "session_id")
    session_days: int = int(os.getenv("SESSION_DAYS", "7"))

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
