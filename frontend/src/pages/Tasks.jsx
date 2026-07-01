import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTasks } from '../context/TasksContext';
import EmptyState from '../components/EmptyState';
import Icon from '../components/Icon';
import TaskCard, { ApprovalCard } from '../components/TaskCard';
import { SkeletonCard } from '../components/Skeleton';
import { FILTERS, matchesFilter } from '../lib/tasks';

const EMPTY_COPY = {
  all: {
    title: 'Nothing delegated yet',
    body: 'Ask G to remind you, schedule something, or make a call — tasks you hand off show up here.',
  },
  approval: {
    title: 'Nothing needs your sign-off',
    body: 'When G wants to do something consequential, it pauses here for your approval first.',
  },
  active: {
    title: 'No active tasks',
    body: 'Scheduled reminders and in-flight work will appear here.',
  },
  done: {
    title: 'Nothing completed yet',
    body: 'Finished tasks land here so you can see what G has handled.',
  },
  issues: {
    title: 'No issues',
    body: 'Tasks that fail or miss their window get flagged here so nothing slips silently.',
  },
};

export default function Tasks() {
  const { tasks, loading, error, refresh } = useTasks();
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const counts = useMemo(() => {
    const c = {};
    for (const f of FILTERS) {
      c[f.key] = tasks.filter((t) => matchesFilter(t, f.key)).length;
    }
    return c;
  }, [tasks]);

  const approvals = useMemo(
    () => tasks.filter((t) => t.status === 'ESCALATION_PENDING'),
    [tasks]
  );

  const visible = useMemo(() => {
    const list = tasks.filter((t) => matchesFilter(t, filter));
    // Approvals get their own spotlight above the list — don't repeat them
    // inside "All".
    return filter === 'all'
      ? list.filter((t) => t.status !== 'ESCALATION_PENDING')
      : filter === 'approval'
        ? []
        : list;
  }, [tasks, filter]);

  const showApprovals =
    (filter === 'all' || filter === 'approval') && approvals.length > 0;

  async function handleRefresh() {
    setRefreshing(true);
    await refresh({ silent: true });
    setRefreshing(false);
  }

  return (
    <div className="page">
      <header className="page-head">
        <div className="page-head__titles">
          <h1 className="page-title">Tasks</h1>
          <p className="page-sub">
            Everything you’ve delegated to G, and where it stands.
          </p>
        </div>
        <div className="page-head__actions">
          <button
            className="btn btn--secondary btn--sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <Icon name="refresh" size={13} className={refreshing ? 'spin' : ''} />
            Refresh
          </button>
          <Link to="/chat" className="btn btn--primary btn--sm">
            <Icon name="plus" size={13} strokeWidth={2.4} />
            New task
          </Link>
        </div>
      </header>

      <div className="task-filters" role="group" aria-label="Filter tasks">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className="task-filter"
            aria-pressed={filter === f.key}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            <span className="task-filter__count">{counts[f.key] ?? 0}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="alert alert--error" role="alert">
          <Icon name="alert-circle" size={16} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="task-list">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard lines={1} />
        </div>
      ) : (
        <>
          {showApprovals && (
            <section className="approvals" aria-label="Needs approval">
              {approvals.map((t) => (
                <ApprovalCard key={t.id} task={t} />
              ))}
            </section>
          )}

          {visible.length === 0 && !showApprovals ? (
            <EmptyState
              icon={filter === 'issues' ? 'check-circle' : 'sparkles'}
              title={EMPTY_COPY[filter].title}
              body={EMPTY_COPY[filter].body}
              cta={
                filter === 'all' ? (
                  <Link to="/chat" className="btn btn--primary">
                    <Icon name="chat" size={15} />
                    Ask G something
                  </Link>
                ) : null
              }
            />
          ) : (
            <div className="task-list">
              {visible.map((t) => (
                <TaskCard key={t.id} task={t} />
              ))}
            </div>
          )}

        </>
      )}
    </div>
  );
}
