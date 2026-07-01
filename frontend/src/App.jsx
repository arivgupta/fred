import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import AppShell from './components/AppShell';
import { TasksProvider } from './context/TasksContext';
import { ToastProvider } from './context/ToastContext';
import { isLoggedIn } from './auth';
import Home from './pages/Home';
import Chat from './pages/Chat';
import Tasks from './pages/Tasks';
import History from './pages/History';
import Settings from './pages/Settings';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import OAuthCallback from './pages/OAuthCallback';
import Step1Family from './pages/Onboard/Step1Family';
import Step2Preferences from './pages/Onboard/Step2Preferences';
import NotFound from './pages/NotFound';

function RequireAuth({ children }) {
  const { pathname } = useLocation();
  if (!isLoggedIn()) {
    return <Navigate to={`/signin?next=${encodeURIComponent(pathname)}`} replace />;
  }
  return children;
}

export default function App() {
  return (
    <ToastProvider>
      <TasksProvider>
        <BrowserRouter>
          <Routes>
            {/* Standalone screens (no shell) */}
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            {/* Legacy path from the first prototype — keep old links alive */}
            <Route path="/register" element={<Navigate to="/signup" replace />} />
            <Route path="/oauth/callback" element={<OAuthCallback />} />
            <Route
              path="/onboard/step1"
              element={<RequireAuth><Step1Family /></RequireAuth>}
            />
            <Route
              path="/onboard/step2"
              element={<RequireAuth><Step2Preferences /></RequireAuth>}
            />

            {/* Main app inside the shell */}
            <Route element={<AppShell />}>
              <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
              <Route path="/chat" element={<RequireAuth><Chat /></RequireAuth>} />
              <Route path="/tasks" element={<RequireAuth><Tasks /></RequireAuth>} />
              <Route
                path="/conversations"
                element={<RequireAuth><History /></RequireAuth>}
              />
              <Route
                path="/profile"
                element={<RequireAuth><Settings /></RequireAuth>}
              />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TasksProvider>
    </ToastProvider>
  );
}
