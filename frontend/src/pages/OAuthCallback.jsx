import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { setToken, setUser } from '../auth';
import Logo from '../components/Logo';

// Landing spot for the backend's Google OAuth redirect. Query params carry
// the session; stash them and route new users into onboarding.
export default function OAuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const userId = params.get('user_id');
    const email = params.get('email');
    const name = params.get('name');
    const token = params.get('token');
    const isNewUser = params.get('new_user') === 'true';

    if (userId && email && token) {
      setUser({ id: userId, email, name: name || '' });
      setToken(token);
      navigate(isNewUser ? '/onboard/step1' : '/', { replace: true });
    } else {
      navigate('/signin', { replace: true });
    }
  }, [params, navigate]);

  return (
    <div className="oauth-wait">
      <Logo size={52} />
      <p>Signing you in…</p>
    </div>
  );
}
