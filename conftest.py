# makes sure pytest can find both import styles used across the test suite:
# adding both the project root and backend/ covers both without changing any test.

import sys
import os


# this change is to just fix the path issue from my end. feel free to revert it if it causes issue on your computer. 
_root = os.path.dirname(__file__)
sys.path.insert(0, _root)
sys.path.insert(0, os.path.join(_root, "backend"))

# Token-at-rest crypto needs a real Fernet key for any test that exercises the
# google_oauth encrypt/decrypt path (UserCalendarAdapter / UserGmailAdapter and
# the dispatch / webhook flows that build them). Provide a valid throwaway key
# for the whole session if the environment doesn't already supply one, so the
# suite runs green with a bare `pytest` and doesn't depend on a manual export.
# We set this *before config is imported* so pydantic's Settings picks it up.
if not os.environ.get("TOKEN_ENCRYPTION_KEY"):
    from cryptography.fernet import Fernet

    os.environ["TOKEN_ENCRYPTION_KEY"] = Fernet.generate_key().decode()
os.environ.setdefault("APP_ENV", "development")
