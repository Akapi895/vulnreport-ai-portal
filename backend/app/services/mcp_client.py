import requests

from app.config import settings


def inspect_deployment(service_name: str) -> str:
    # MVP lab transport: HTTP endpoint that models the MCP tool call used in Path 4.
    response = requests.post(
        f"{settings.mcp_url}/inspect_deployment",
        json={"service_name": service_name},
        timeout=10,
    )
    response.raise_for_status()
    return response.text
