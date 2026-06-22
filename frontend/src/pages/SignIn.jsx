import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isLoggedIn } from '../auth';
import FredOrb from '../components/FredOrb';
import GoogleSignOn from '../components/registration/GoogleAuthButton';

export default function SignIn() {
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn()) navigate('/today', { replace: true });
  }, [navigate]);

  return (
    <div className="signup-page">
      <div className="signup-card">
        <FredOrb size={78} state="idle" />
        <div className="signup-logo">Welcome back</div>
        <p className="signup-tagline">Sign in to pick up where you and FRED left off.</p>
        <GoogleSignOn mode="signin" />
      </div>
    </div>
  );
}
