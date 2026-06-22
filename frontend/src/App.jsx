import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import NavBar from './components/NavBar';
import { TaskProvider } from './context/TaskContext';
import { isLoggedIn } from './auth';
import Landing from './pages/Landing';
import Today from './pages/Today';
import Profile from './pages/Profile';
import Conversations from './pages/Conversations';
import Tasks from './pages/Tasks';
import Chat from './pages/Chat';
import Register from './pages/Register';
import SignUp from './pages/SignUp';
import SignIn from './pages/SignIn';
import Step1Family from './pages/Onboard/Step1Family';
import Step2Preferences from './pages/Onboard/Step2Preferences';
import OAuthCallback from './pages/OAuthCallback';

// Full-bleed routes that render without the app's mission-control sidebar.
const NO_NAV_PATHS = ['/', '/signup', '/signin', '/onboard', '/oauth'];

function RequireAuth({ children }) {
  const { pathname } = useLocation();
  if (!isLoggedIn()) return <Navigate to={`/signin?next=${encodeURIComponent(pathname)}`} replace />;
  return children;
}

function AppContent() {
  const { pathname } = useLocation();
  const hideNav = NO_NAV_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
  const isChatPage = pathname === '/chat';

  return (
    <div className={hideNav ? '' : 'app-layout'}>
      {!hideNav && <NavBar />}
      <main className={hideNav ? '' : `main-content${isChatPage ? ' main-content--chat' : ''}`}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/onboard/step1" element={<RequireAuth><Step1Family /></RequireAuth>} />
          <Route path="/onboard/step2" element={<RequireAuth><Step2Preferences /></RequireAuth>} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />
          <Route path="/register" element={<Register />} />
          <Route path="/today" element={<RequireAuth><Today /></RequireAuth>} />
          <Route path="/tasks" element={<RequireAuth><Tasks /></RequireAuth>} />
          <Route path="/chat" element={<RequireAuth><Chat /></RequireAuth>} />
          <Route path="/conversations" element={<RequireAuth><Conversations /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <TaskProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TaskProvider>
  );
}
