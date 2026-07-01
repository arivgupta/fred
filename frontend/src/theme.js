// Theme management. The <html data-theme> attribute drives all design
// tokens (see styles/tokens.css). An inline script in index.html applies
// the stored theme before first paint to avoid a flash.

const THEME_KEY = 'g_theme';

export function getTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function setTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
  document.documentElement.dataset.theme = theme;
  window.dispatchEvent(new Event('g:theme'));
}

export function toggleTheme() {
  setTheme(getTheme() === 'dark' ? 'light' : 'dark');
}
