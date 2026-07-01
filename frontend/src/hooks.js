import { useEffect, useState } from 'react';
import { getUser } from './auth';

// Current signed-in user, live-updated on sign-in / sign-out (including
// from other tabs via the storage event).
export function useAuthUser() {
  const [user, setUserState] = useState(getUser);

  useEffect(() => {
    const sync = () => setUserState(getUser());
    window.addEventListener('g:auth', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('g:auth', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return user;
}

// Ticks every `intervalMs`; used for countdowns / relative timestamps.
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
