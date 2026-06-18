import json
from pathlib import Path


ASSETS_PATH = Path(__file__).resolve().parents[1] / "data" / "internal_assets.json"


def load_assets() -> list[dict]:
    return json.loads(ASSETS_PATH.read_text(encoding="utf-8"))


def get_service_status(service_name: str) -> dict:
    for asset in load_assets():
        if asset["service_name"] == service_name:
            return asset
    return {
        "service_name": service_name,
        "status": "unknown",
        "message": "service not found",
    }
