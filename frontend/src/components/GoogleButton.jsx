// Kicks off the Google OAuth code flow. The backend (/oauth/google)
// exchanges the code, stores calendar+gmail tokens, then redirects back
// to /oauth/callback with a session token.

import { useEffect, useRef, useState } from 'react';
import { GoogleIcon } from './Icon';

const SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/calendar',
].join(' ');

export default function GoogleButton({ label = 'Continue with Google' }) {
  const clientRef = useRef(null);
  const [ready, setReady] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) return undefined;

    const init = () => {
      if (!window.google?.accounts?.oauth2) return;
      clientRef.current = window.google.accounts.oauth2.initCodeClient({
        client_id: clientId,
        scope: SCOPES,
        ux_mode: 'redirect',
        redirect_uri: `${import.meta.env.VITE_API_BASE_URL}/oauth/google`,
        access_type: 'offline',
        prompt: 'consent',
      });
      setReady(true);
    };

    if (window.google?.accounts?.oauth2) {
      init();
      return undefined;
    }
    window.addEventListener('load', init);
    return () => window.removeEventListener('load', init);
  }, [clientId]);

  // No client id configured (e.g. local dev without Google creds):
  // hide the button rather than render one that silently does nothing.
  if (!clientId) return null;

  return (
    <button
      type="button"
      className="btn btn--google btn--lg btn--block"
      onClick={() => clientRef.current?.requestCode()}
      disabled={!ready}
    >
      <GoogleIcon size={17} />
      {label}
    </button>
  );
}
