import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { getTheme } from './theme';
import './styles/index.css';

// Belt-and-braces: index.html sets data-theme pre-paint; re-assert here in
// case the inline script was stripped by an intermediary.
document.documentElement.dataset.theme = getTheme();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
