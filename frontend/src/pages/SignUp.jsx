import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../api';
import { isLoggedIn, setToken, setUser } from '../auth';
import AuthLayout from '../components/AuthLayout';
import GoogleButton from '../components/GoogleButton';
import Icon from '../components/Icon';
import { TextField } from '../components/controls';

export default function SignUp() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isLoggedIn()) navigate('/', { replace: true });
  }, [navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (busy) return;
    setError('');
    if (password.length < 8) {
      setError('Password needs at least 8 characters.');
      return;
    }
    setBusy(true);
    try {
      const { user, token } = await register(name.trim(), email.trim(), password);
      setUser(user);
      setToken(token);
      // New accounts go through onboarding to set phone + family.
      navigate('/onboard/step1', { replace: true });
    } catch (err) {
      setError(err.message || 'Could not create your account.');
    } finally {
      setBusy(false);
    }
  }

  const hasGoogle = !!import.meta.env.VITE_GOOGLE_CLIENT_ID;

  return (
    <AuthLayout>
      <h2 className="auth__card-title">Meet your new secretary</h2>
      <p className="auth__card-sub">
        Two minutes of setup, then G takes it from here.
      </p>

      {error && (
        <div className="alert alert--error" role="alert">
          <Icon name="alert-circle" size={16} />
          <span>{error}</span>
        </div>
      )}

      <form className="auth__form" onSubmit={handleSubmit}>
        <TextField
          label="Your name"
          autoComplete="name"
          placeholder="Alex Johnson"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
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
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
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
          {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      {hasGoogle && (
        <>
          <div className="auth__divider">or</div>
          <GoogleButton label="Sign up with Google" />
        </>
      )}

      <p className="auth__switch">
        Already have an account? <Link to="/signin">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
