from app.services.mcp_client import inspect_deployment


def inspect_deployment_tool(service_name: str) -> str:
    return inspect_deployment(service_name)
