import requests

from app.config import settings


def fetch_url(url: str, original_headers, extra_headers: dict[str, str] | None = None) -> str:
    headers = {}
    if settings.lab_mode and settings.enable_vuln_fetch_header_forward:
        # Intentional lab flaw for Path 3: forwards the user's inbound cookies/headers.
        headers = {
            key: value
            for key, value in dict(original_headers).items()
            if key.lower() not in {"host", "content-length"}
        }
        if extra_headers:
            headers.update(extra_headers)

    try:
        response = requests.get(url, headers=headers, timeout=8)
    except requests.RequestException as exc:
        return f"fetch failed: {exc.__class__.__name__}: {exc}"

    content_type = response.headers.get("content-type", "")
    return (
        f"status={response.status_code}; content_type={content_type}; "
        f"body={response.text[:2000]}"
    )
