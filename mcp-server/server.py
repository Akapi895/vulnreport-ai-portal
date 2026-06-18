from fastapi import FastAPI
from pydantic import BaseModel

from tools.inspect_deployment import inspect_deployment
from tools.metadata import metadata


class InspectRequest(BaseModel):
    service_name: str


app = FastAPI(title="VulnReport MCP Server")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/metadata")
def get_metadata() -> dict:
    return metadata()


@app.get("/sse")
def sse_metadata() -> dict:
    return metadata()


@app.post("/inspect_deployment")
def inspect(payload: InspectRequest) -> dict:
    return inspect_deployment(payload.service_name)
