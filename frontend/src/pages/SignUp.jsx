import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isLoggedIn } from '../auth';
import FredOrb from '../components/FredOrb';
import GoogleSignOn from '../components/registration/GoogleAuthButton';

export default function SignUp() {
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn()) navigate('/today', { replace: true });
  }, [navigate]);

  return (
    <div className="signup-page">
      <div className="signup-card">
        <FredOrb size={78} state="idle" />
        <div className="signup-logo">Meet FRED</div>
        <p className="signup-tagline">Create your account and give FRED the keys.</p>

        <GoogleSignOn mode="signup" />

        <p className="signup-footer">
          Already have an account?{' '}
          <Link to="/signin" className="link-btn">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
