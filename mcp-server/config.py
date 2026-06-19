import os
from dataclasses import dataclass


def _bool_env(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Settings:
    lab_mode: bool = _bool_env("LAB_MODE", True)
    enable_vuln_mcp_secret_leak: bool = _bool_env("ENABLE_VULN_MCP_SECRET_LEAK", True)
    db_host: str = os.getenv("DB_HOST", "postgres")
    db_port: str = os.getenv("DB_PORT", "5432")
    db_name: str = os.getenv("DB_NAME", "vulnreport")
    db_user: str = os.getenv("DB_USER", "vulnapp")
    db_password: str = os.getenv("DB_PASSWORD", "vulnpass123")
    path4_flag: str = os.getenv("PATH4_FLAG", "")


settings = Settings()
