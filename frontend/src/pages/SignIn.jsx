import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { login } from '../api';
import { isLoggedIn, setToken, setUser } from '../auth';
import AuthLayout from '../components/AuthLayout';
import GoogleButton from '../components/GoogleButton';
import Icon from '../components/Icon';
import { TextField } from '../components/controls';

export default function SignIn() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isLoggedIn()) navigate(next, { replace: true });
  }, [navigate, next]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      const { user, token } = await login(email.trim(), password);
      setUser(user);
      setToken(token);
      navigate(next, { replace: true });
    } catch (err) {
      setError(err.message || 'Sign in failed. Check your email and password.');
    } finally {
      setBusy(false);
    }
  }

  const hasGoogle = !!import.meta.env.VITE_GOOGLE_CLIENT_ID;

  return (
    <AuthLayout>
      <h2 className="auth__card-title">Welcome back</h2>
      <p className="auth__card-sub">Sign in to pick up where you left off.</p>

      {error && (
        <div className="alert alert--error" role="alert">
          <Icon name="alert-circle" size={16} />
          <span>{error}</span>
        </div>
      )}

      <form className="auth__form" onSubmit={handleSubmit}>
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <label className="field">
          <span className="field__label">Password</span>
          <span className="input-affix">
            <input
              type={showPw ? 'text' : 'password'}
              className="input"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="input-affix__end"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              <Icon name={showPw ? 'eye-off' : 'eye'} size={16} />
            </button>
          </span>
        </label>
        <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={busy}>
          {busy ? <Icon name="loader" size={16} className="spin" /> : null}
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      {hasGoogle && (
        <>
          <div className="auth__divider">or</div>
          <GoogleButton label="Sign in with Google" />
        </>
      )}

      <p className="auth__switch">
        New here? <Link to="/signup">Create an account</Link>
      </p>
      <p className="auth__footnote">
        By continuing you agree to let G send texts and place calls on your
        behalf — only when you ask it to.
      </p>
    </AuthLayout>
  );
}
