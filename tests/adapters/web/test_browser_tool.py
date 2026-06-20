# Tests for FRED's browser — the agentic web-research tool.
# httpx is patched so no real network calls happen; we assert the tool's
# contract: provider selection, graceful degradation, structured errors,
# Tavily/Brave research shapes, and single-page reads.

from types import SimpleNamespace
from unittest.mock import patch

import pytest

from adapters.web.browser_tool import BrowserTool, _TextExtractor
from adapters.web.user_browser_adapter import UserBrowserAdapter


class _FakeResp:
    def __init__(self, json_data=None, text="", url="https://example.com"):
        self._json = json_data or {}
        self.text = text
        self.url = url

    def json(self):
        return self._json

    def raise_for_status(self):
        return None


# ── provider selection ──────────────────────────────────────────────────
def test_provider_prefers_tavily():
    assert BrowserTool(tavily_api_key="t", brave_api_key="b").provider == "tavily"


def test_provider_falls_back_to_brave():
    assert BrowserTool(tavily_api_key="", brave_api_key="b").provider == "brave"


def test_provider_none_when_unconfigured():
    assert BrowserTool(tavily_api_key="", brave_api_key="").provider == "none"


# ── graceful degradation & input validation ─────────────────────────────
def test_research_unavailable_without_keys():
    res = BrowserTool(tavily_api_key="", brave_api_key="").execute({"query": "best tacos"})
    assert res["status"] == "unavailable"
    assert res["mode"] == "research"
    assert res["query"] == "best tacos"


def test_missing_params_returns_error():
    res = BrowserTool(tavily_api_key="", brave_api_key="").execute({})
    assert res["status"] == "error"


def test_accepts_goal_and_message_as_query_aliases():
    tool = BrowserTool(tavily_api_key="", brave_api_key="")
    assert tool.execute({"goal": "x"})["status"] == "unavailable"
    assert tool.execute({"message": "y"})["status"] == "unavailable"


# ── Tavily research ─────────────────────────────────────────────────────
def test_research_tavily_shapes_answer_and_sources():
    payload = {
        "answer": "Open Saturday: Bright Smiles.",
        "results": [
            {"title": "Bright Smiles", "url": "https://bright.example", "content": "Open Sat 9-2."},
            {"title": "Kids Dental", "url": "https://kids.example", "content": "Closed weekends."},
        ],
    }
    tool = BrowserTool(tavily_api_key="tav", brave_api_key="")
    with patch("httpx.post", return_value=_FakeResp(json_data=payload)) as mock_post:
        res = tool.execute({"query": "pediatric dentist open saturday", "max_results": 2})
    assert mock_post.called
    assert res["status"] == "ok"
    assert res["provider"] == "tavily"
    assert res["answer"] == "Open Saturday: Bright Smiles."
    assert len(res["sources"]) == 2
    assert res["sources"][0]["url"] == "https://bright.example"


def test_research_tavily_network_error_is_structured_not_raised():
    tool = BrowserTool(tavily_api_key="tav", brave_api_key="")
    with patch("httpx.post", side_effect=RuntimeError("boom")):
        res = tool.execute({"query": "anything"})
    assert res["status"] == "error"
    assert "boom" in res["error"]


# ── Brave research ──────────────────────────────────────────────────────
def test_research_brave_shapes_sources():
    payload = {"web": {"results": [
        {"title": "A", "url": "https://a.example", "description": "desc a"},
    ]}}
    tool = BrowserTool(tavily_api_key="", brave_api_key="brave")
    with patch("httpx.get", return_value=_FakeResp(json_data=payload)) as mock_get:
        res = tool.execute({"query": "thing"})
    assert mock_get.called
    assert res["status"] == "ok"
    assert res["provider"] == "brave"
    assert res["answer"] is None
    assert res["sources"][0]["title"] == "A"


# ── reading a page ──────────────────────────────────────────────────────
def test_read_extracts_title_and_text_drops_script():
    html = (
        "<html><head><title>Hours</title></head>"
        "<body><script>var x=1;</script><p>Open 9 to 5</p>"
        "<style>.a{}</style></body></html>"
    )
    tool = BrowserTool(tavily_api_key="", brave_api_key="")  # read doesn't need a key
    with patch("httpx.get", return_value=_FakeResp(text=html, url="https://shop.example")):
        res = tool.execute({"url": "shop.example"})
    assert res["status"] == "ok"
    assert res["mode"] == "read"
    assert res["title"] == "Hours"
    assert "Open 9 to 5" in res["text"]
    assert "var x" not in res["text"]


def test_read_error_is_structured():
    tool = BrowserTool(tavily_api_key="", brave_api_key="")
    with patch("httpx.get", side_effect=RuntimeError("dns fail")):
        res = tool.execute({"url": "https://nope.example"})
    assert res["status"] == "error"
    assert res["mode"] == "read"


def test_text_extractor_collapses_whitespace():
    p = _TextExtractor()
    p.feed("<p>hello   \n   world</p>")
    assert p.get_text() == "hello world"


# ── user-scoped adapter ─────────────────────────────────────────────────
def test_user_adapter_localizes_near_me():
    captured = {}

    class _StubTool:
        def execute(self, params):
            captured.update(params)
            return {"status": "ok"}

    user = SimpleNamespace(city="Santa Monica")
    UserBrowserAdapter(user, browser_tool=_StubTool()).execute({"query": "tacos near me"})
    assert captured["query"] == "tacos near me (near Santa Monica)"


def test_user_adapter_passthrough_without_location():
    captured = {}

    class _StubTool:
        def execute(self, params):
            captured.update(params)
            return {"status": "ok"}

    user = SimpleNamespace()  # no location attrs
    UserBrowserAdapter(user, browser_tool=_StubTool()).execute({"query": "tacos near me"})
    assert captured["query"] == "tacos near me"


def test_user_adapter_does_not_touch_url_reads():
    captured = {}

    class _StubTool:
        def execute(self, params):
            captured.update(params)
            return {"status": "ok"}

    user = SimpleNamespace(city="Santa Monica")
    UserBrowserAdapter(user, browser_tool=_StubTool()).execute({"url": "https://x.example", "query": "x near me"})
    assert "near Santa Monica" not in (captured.get("query") or "")
