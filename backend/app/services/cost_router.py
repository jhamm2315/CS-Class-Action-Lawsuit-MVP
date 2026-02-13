import os
from typing import Literal, Tuple
from app.config import settings

Provider = Literal["openai", "anthropic", "local"]

def choose_provider(prompt_tokens: int, latency_sensitive: bool = False) -> Provider:
    # Very simple rules; expand with live pricing if needed
    if settings.OPENAI_API_KEY:
        return "openai"
    if settings.ANTHROPIC_API_KEY:
        return "anthropic"
    return "local"

async def llm_complete(system: str, user: str) -> str:
    prov = choose_provider(len(user.split()))
    if prov == "openai":
        # lazy import to keep deps optional
        import httpx, json
        model = "gpt-4o-mini"  # cheap + capable
        async with httpx.AsyncClient(timeout=60) as c:
            r = await c.post("https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
                json={"model": model, "messages":[{"role":"system","content":system},{"role":"user","content":user}],
                      "temperature":0.2})
            r.raise_for_status()
            return r.json()["choices"][0]["message"]["content"]
    elif prov == "anthropic":
        import httpx
        async with httpx.AsyncClient(timeout=60) as c:
            r = await c.post("https://api.anthropic.com/v1/messages",
                headers={"x-api-key": settings.ANTHROPIC_API_KEY, "anthropic-version":"2023-06-01"},
                json={"model":"claude-3-haiku-20240307","max_tokens":800,"system":system,"messages":[{"role":"user","content":user}]})
            r.raise_for_status()
            return r.json()["content"][0]["text"]
    else:
        # local fallback: echo/heuristic summarizer
        return user[:800]