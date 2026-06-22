# FRED's browser — the agentic web-research tool.
#
# This is the capability that lets FRED actually *go do things*: research a
# question, compare options, check hours/prices, or read a specific page, then
# report back. It plugs into the same orchestrator / TaskRunner / dispatch path
# as every other tool (it inherits BaseToolAdapter.execute()), so the planner
# can mix it with sms_tool / calendar_tool / call_tool freely.
#
# Two modes, chosen from the step params:
#   - research:  params["query"]  -> a question / what to find on the open web
#   - read:      params["url"]     -> a specific page to fetch and summarize
#
# Pluggable backend with graceful degradation:
#   - TAVILY_API_KEY set  -> Tavily search (returns a synthesized answer + sources)
#   - BRAVE_API_KEY set   -> Brave web search (raw results)
#   - neither set         -> returns {"status": "unavailable", ...} so the agent
#                            loop never hard-fails; FRED just tells the user he
#                            can't browse right now.
#
# Network/parse errors are caught and returned as a structured result rather
# than raised, so a flaky fetch never kills an in-flight call or chat turn.

from __future__ import annotations

import logging
import os
import re
from html.parser import HTMLParser
from typing import Any

from adapters.base import BaseToolAdapter

logger = logging.getLogger("backend.adapters.web.browser_tool")

_DEFAULT_MAX_RESULTS = 5
_FETCH_TIMEOUT_S = 12.0
_MAX_TEXT_CHARS = 6000  # keep results small enough to feed back to the LLM
_USER_AGENT = (
    "Mozilla/5.0 (compatible; FREDBot/1.0; +https://fred.assistant) "
    "Python-httpx"
)


class _TextExtractor(HTMLParser):
    """Minimal HTML -> readable text. Drops script/style, collapses whitespace.
    Avoids pulling in bs4/lxml as dependencies for a best-effort page read."""

    _SKIP = {"script", "style", "noscript", "svg", "nav", "footer"}

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self._chunks: list[str] = []
        self._skip_depth = 0
        self.title: str | None = None
        self._in_title = False

    def handle_starttag(self, tag, attrs):
        if tag in self._SKIP:
            self._skip_depth += 1
        if tag == "title":
            self._in_title = True

    def handle_endtag(self, tag):
        if tag in self._SKIP and self._skip_depth > 0:
            self._skip_depth -= 1
        if tag == "title":
            self._in_title = False

    def handle_data(self, data):
        if self._skip_depth:
            return
        text = data.strip()
        if not text:
            return
        if self._in_title and not self.title:
            self.title = text
        self._chunks.append(text)

    def get_text(self) -> str:
        joined = " ".join(self._chunks)
        return re.sub(r"\s+", " ", joined).strip()


def _truncate(text: str, limit: int = _MAX_TEXT_CHARS) -> str:
    if len(text) <= limit:
        return text
    return text[:limit].rsplit(" ", 1)[0] + " …[truncated]"


class BrowserTool(BaseToolAdapter):
    """Read-only web research. Safe to run without confirmation."""

    def __init__(
        self,
        tavily_api_key: str | None = None,
        brave_api_key: str | None = None,
    ):
        super().__init__(tool_name="browser_tool")
        self.tavily_api_key = tavily_api_key if tavily_api_key is not None else os.getenv("TAVILY_API_KEY", "")
        self.brave_api_key = brave_api_key if brave_api_key is not None else os.getenv("BRAVE_API_KEY", "")

    # ── public contract ────────────────────────────────────────────────
    def execute(self, params: dict) -> dict[str, Any]:
        params = params or {}
        url = (params.get("url") or "").strip()
        query = (params.get("query") or params.get("goal") or params.get("message") or "").strip()
        max_results = int(params.get("max_results") or _DEFAULT_MAX_RESULTS)

        try:
            if url:
                return self._read(url)
            if query:
                return self._research(query, max_results)
        except Exception as exc:  # never let a fetch kill the agent loop
            logger.warning("browser_tool failed: %s: %s", type(exc).__name__, exc)
            return {
                "status": "error",
                "mode": "read" if url else "research",
                "query": query or None,
                "url": url or None,
                "error": f"{type(exc).__name__}: {exc}",
            }

        return {
            "status": "error",
            "error": "browser_tool needs either `query` (to research) or `url` (to read).",
        }

    @property
    def provider(self) -> str:
        if self.tavily_api_key:
            return "tavily"
        if self.brave_api_key:
            return "brave"
        return "none"

    # ── research ───────────────────────────────────────────────────────
    def _research(self, query: str, max_results: int) -> dict[str, Any]:
        if self.provider == "tavily":
            return self._research_tavily(query, max_results)
        if self.provider == "brave":
            return self._research_brave(query, max_results)
        return {
            "status": "unavailable",
            "mode": "research",
            "query": query,
            "message": (
                "Web research isn't configured. Set TAVILY_API_KEY (preferred) "
                "or BRAVE_API_KEY to give FRED a browser."
            ),
        }

    def _research_tavily(self, query: str, max_results: int) -> dict[str, Any]:
        import httpx

        resp = httpx.post(
            "https://api.tavily.com/search",
            json={
                "api_key": self.tavily_api_key,
                "query": query,
                "max_results": max_results,
                "include_answer": True,
                "search_depth": "basic",
            },
            timeout=_FETCH_TIMEOUT_S,
        )
        resp.raise_for_status()
        data = resp.json()
        sources = [
            {
                "title": r.get("title"),
                "url": r.get("url"),
                "snippet": _truncate(r.get("content") or "", 400),
            }
            for r in (data.get("results") or [])[:max_results]
        ]
        return {
            "status": "ok",
            "mode": "research",
            "provider": "tavily",
            "query": query,
            "answer": data.get("answer"),
            "sources": sources,
        }

    def _research_brave(self, query: str, max_results: int) -> dict[str, Any]:
        import httpx

        resp = httpx.get(
            "https://api.search.brave.com/res/v1/web/search",
            params={"q": query, "count": max_results},
            headers={
                "Accept": "application/json",
                "X-Subscription-Token": self.brave_api_key,
            },
            timeout=_FETCH_TIMEOUT_S,
        )
        resp.raise_for_status()
        data = resp.json()
        web = (data.get("web") or {}).get("results") or []
        sources = [
            {
                "title": r.get("title"),
                "url": r.get("url"),
                "snippet": _truncate(r.get("description") or "", 400),
            }
            for r in web[:max_results]
        ]
        return {
            "status": "ok",
            "mode": "research",
            "provider": "brave",
            "query": query,
            "answer": None,  # Brave returns links, not a synthesized answer
            "sources": sources,
        }

    # ── read a single page ─────────────────────────────────────────────
    def _read(self, url: str) -> dict[str, Any]:
        import httpx

        if not re.match(r"^https?://", url):
            url = "https://" + url
        resp = httpx.get(
            url,
            timeout=_FETCH_TIMEOUT_S,
            follow_redirects=True,
            headers={"User-Agent": _USER_AGENT},
        )
        resp.raise_for_status()
        parser = _TextExtractor()
        parser.feed(resp.text)
        return {
            "status": "ok",
            "mode": "read",
            "url": str(resp.url),
            "title": parser.title,
            "text": _truncate(parser.get_text()),
        }
