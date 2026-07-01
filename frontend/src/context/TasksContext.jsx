import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { approveEscalation, denyEscalation, getTasks } from '../api';
import { useAuthUser } from '../hooks';
import { normalizeTask } from '../lib/tasks';

// Live task store backed by the real API. Feeds the Tasks page, the Home
// overview, and the "needs approval" badge in the nav. Polls gently while
// the tab is visible so escalations surface without a manual refresh.

const TasksContext = createContext(null);

const POLL_MS = 30_000;

export function TasksProvider({ children }) {
  const user = useAuthUser();
  const userId = user?.id || null;

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const loadedForRef = useRef(null);

  const refresh = useCallback(
    async ({ silent = false } = {}) => {
      if (!userId) {
        setTasks([]);
        setError('');
        setLoading(false);
        loadedForRef.current = null;
        return;
      }
      if (!silent) setLoading(true);
      try {
        const rows = await getTasks(userId);
        setTasks(rows.map(normalizeTask));
        setError('');
        loadedForRef.current = userId;
      } catch (err) {
        if (!silent) setError(err.message || 'Could not load tasks');
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [userId]
  );

  useEffect(() => {
    refresh();
    if (!userId) return undefined;
    const id = setInterval(() => {
      if (!document.hidden) refresh({ silent: true });
    }, POLL_MS);
    return () => clearInterval(id);
  }, [refresh, userId]);

  const approve = useCallback(
    async (taskId) => {
      await approveEscalation(taskId);
      await refresh({ silent: true });
    },
    [refresh]
  );

  const deny = useCallback(
    async (taskId) => {
      await denyEscalation(taskId);
      await refresh({ silent: true });
    },
    [refresh]
  );

  const approvalsCount = useMemo(
    () => tasks.filter((t) => t.status === 'ESCALATION_PENDING').length,
    [tasks]
  );

  const value = useMemo(
    () => ({
      tasks,
      loading: loading && loadedForRef.current !== userId,
      error,
      refresh,
      approve,
      deny,
      approvalsCount,
    }),
    [tasks, loading, error, refresh, approve, deny, approvalsCount, userId]
  );

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}

export function useTasks() {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error('useTasks must be used within TasksProvider');
  return ctx;
}
