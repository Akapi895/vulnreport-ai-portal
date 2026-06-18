def metadata() -> dict:
    return {
        "name": "vulnreport-mcp",
        "transport": "http-demo",
        "tools": ["inspect_deployment", "service_status", "metadata"],
        "note": "metadata endpoint is public for recon; tool execution is used by backend",
    }
