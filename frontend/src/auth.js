// Session storage for the signed-in user. localStorage-backed so a
// refresh keeps you signed in; a `g:auth` window event lets React
// providers react to sign-in / sign-out without prop drilling.

const USER_KEY = 'g_user';
const TOKEN_KEY = 'g_token';

function emitAuthChange() {
  window.dispatchEvent(new Event('g:auth'));
}

export function getUser() {
  const raw = localStorage.getItem(USER_KEY);
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  emitAuthChange();
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
  emitAuthChange();
}

export function isLoggedIn() {
  return !!localStorage.getItem(TOKEN_KEY);
}

export function clearUser() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  emitAuthChange();
}
