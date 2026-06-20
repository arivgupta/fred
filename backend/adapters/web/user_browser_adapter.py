# User-scoped wrapper around BrowserTool, mirroring the pattern used by the
# other user adapters (UserSMSAdapter, UserCalendarAdapter, ...). The browser
# itself needs no per-user secret, but binding to the user lets FRED localize
# ambiguous "near me" research using whatever location hints the profile has,
# without the LLM ever having to know or pass them.

from __future__ import annotations

import re
from typing import Any

from adapters.base import BaseToolAdapter
from adapters.web.browser_tool import BrowserTool

# "near me", "nearby", "around here", "close by" -> localize the query.
_NEARBY = re.compile(r"\b(near\s*me|nearby|near\s*by|around\s*here|close\s*by)\b", re.IGNORECASE)


def _user_location(user) -> str | None:
    """Best-effort location hint from the user row. Returns None when we have
    nothing useful, in which case the query is passed through untouched."""
    for attr in ("city", "location", "address", "timezone"):
        val = getattr(user, attr, None)
        if val and isinstance(val, str) and val.strip():
            return val.strip()
    return None


class UserBrowserAdapter(BaseToolAdapter):
    def __init__(self, user, browser_tool: BrowserTool | None = None):
        super().__init__("browser_tool")
        self._tool = browser_tool or BrowserTool()
        self._location = _user_location(user)

    def execute(self, params: dict) -> Any:
        params = dict(params or {})
        query = params.get("query") or params.get("goal") or params.get("message")
        # Gently localize "near me" / "nearby" research when we know where the
        # user is. Don't touch a `url` read or an already-located query.
        if query and not params.get("url") and self._location and _NEARBY.search(query):
            params["query"] = f"{query} (near {self._location})"
        return self._tool.execute(params)
