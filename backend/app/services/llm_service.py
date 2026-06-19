import requests

from app.config import settings


def complete(prompt: str) -> str:
    try:
        response = requests.post(
            f"{settings.llm_url}/api/generate",
            json={"model": settings.llm_model, "prompt": prompt, "stream": False},
            timeout=settings.llm_timeout_seconds,
        )
        response.raise_for_status()
        data = response.json()
        return data.get("response") or data.get("text") or ""
    except requests.RequestException as exc:
        return f"LLM request failed: {exc.__class__.__name__}"
