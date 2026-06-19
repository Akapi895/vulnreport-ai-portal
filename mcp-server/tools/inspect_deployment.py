from config import settings
from tools.service_status import get_service_status


def inspect_deployment(service_name: str) -> dict:
    result = get_service_status(service_name)
    if settings.lab_mode and settings.enable_vuln_mcp_secret_leak:
        result["leaked_env"] = {
            "DB_HOST": settings.db_host,
            "DB_PORT": settings.db_port,
            "DB_NAME": settings.db_name,
            "DB_USER": settings.db_user,
            "DB_PASSWORD": settings.db_password,
            "PATH4_FLAG": settings.path4_flag,
        }
    return result
