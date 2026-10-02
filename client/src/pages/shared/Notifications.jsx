import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { BellOff, CheckCheck, Trash2 } from 'lucide-react';
import { notificationApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { NOTIFICATION_META } from '../../components/layout/NotificationBell';
import {
  Button,
  EmptyState,
  ErrorState,
  IconButton,
  Pagination,
  Skeleton,
  Tabs,
} from '../../components/ui';
import { PageHeader } from '../../components/layout/BackButton';
import { formatDateTime, timeAgo } from '../../utils/format';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
];

const TYPE_LABEL = {
  enrollment: 'Enrolment',
  new_lesson: 'New lesson',
  course_approval: 'Course approval',
  course_rejection: 'Course rejected',
  course_completion: 'Completion',
  instructor_update: 'Instructor update',
  certificate: 'Certificate',
  review: 'Review',
  system: 'System',
};

export default function Notifications() {
  const navigate = useNavigate();
  // Back falls through to the signed-in role's own dashboard.
  const { home } = useAuth();

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [tab, setTab] = useState('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await notificationApi.list({
        page,
        limit: 20,
        ...(tab === 'unread' ? { unread: 'true' } : {}),
      });
      setItems(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  useEffect(() => {
    load();
  }, [load]);

  const open = async (item) => {
    if (!item.isRead) {
      try {
        await notificationApi.markRead(item._id);
        setItems((current) =>
          current.map((row) => (row._id === item._id ? { ...row, isRead: true } : row))
        );
      } catch {
        /* navigation matters more */
      }
    }
    if (item.link) navigate(item.link);
  };

  const markAll = async () => {
    setBusy(true);
    try {
      const result = await notificationApi.markAllRead();
      toast.success(
        result.updated > 0
          ? `${result.updated} notification${result.updated === 1 ? '' : 's'} marked as read.`
          : 'Nothing was unread.'
      );
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const clearRead = async () => {
    setBusy(true);
    try {
      const result = await notificationApi.clearRead();
      toast.success(
        result.deleted > 0
          ? `${result.deleted} read notification${result.deleted === 1 ? '' : 's'} cleared.`
          : 'There was nothing to clear.'
      );
      setPage(1);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    try {
      await notificationApi.remove(id);
      setItems((current) => current.filter((row) => row._id !== id));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const unreadCount = meta?.unreadCount ?? 0;

  return (
    <div className="space-y-7">
      <PageHeader
        backTo={home}
        title="Notifications"
        description="Enrolments, new lessons, approvals, completions and instructor updates."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" icon={CheckCheck} onClick={markAll} disabled={busy || unreadCount === 0}>
              Mark all read
            </Button>
            <Button variant="ghost" icon={Trash2} onClick={clearRead} disabled={busy}>
              Clear read
            </Button>
          </div>
        }
      />

      <Tabs
        tabs={TABS.map((item) => ({
          ...item,
          count: item.id === 'unread' ? unreadCount : meta?.total,
        }))}
        active={tab}
        onChange={(next) => {
          setTab(next);
          setPage(1);
        }}
      />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : items.length === 0 ? (
        <div className="surface-raised">
          <EmptyState
            icon={BellOff}
            title={tab === 'unread' ? 'Nothing unread' : 'No notifications yet'}
            description={
              tab === 'unread'
                ? 'You are all caught up.'
                : 'Enrol in a course, publish something, or wait for an instructor update — notifications will land here.'
            }
            action={
              tab === 'unread' ? (
                <Button variant="secondary" onClick={() => setTab('all')}>
                  View all notifications
                </Button>
              ) : (
                <Link to="/courses" className="btn-primary">
                  Browse courses
                </Link>
              )
            }
          />
        </div>
      ) : (
        <>
          <ul className="space-y-2.5">
            {items.map((item) => {
              const metaInfo = NOTIFICATION_META[item.type] || NOTIFICATION_META.system;

              return (
                <li
                  key={item._id}
                  className={clsx(
                    'surface-raised flex gap-4 p-4 transition-colors',
                    !item.isRead && 'border-violet-500/30 bg-violet-600/[0.06]'
                  )}
                >
                  <span
                    className={clsx(
                      'mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl',
                      metaInfo.tone
                    )}
                  >
                    <metaInfo.icon className="h-4.5 w-4.5" aria-hidden="true" />
                  </span>

                  <button
                    type="button"
                    onClick={() => open(item)}
                    className="min-w-0 flex-1 text-left"
                    disabled={!item.link}
                  >
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-white">{item.title}</span>
                      <span className="badge-slate">{TYPE_LABEL[item.type] || item.type}</span>
                      {!item.isRead && (
                        <span className="h-1.5 w-1.5 rounded-full bg-violet-400" aria-label="Unread" />
                      )}
                    </span>

                    {item.message && (
                      <span className="mt-1 block text-sm leading-relaxed text-slate-400">
                        {item.message}
                      </span>
                    )}

                    <span className="mt-1.5 flex flex-wrap items-center gap-2 text-2xs text-slate-600">
                      <span title={formatDateTime(item.createdAt)}>{timeAgo(item.createdAt)}</span>
                      {item.course?.title && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="truncate">{item.course.title}</span>
                        </>
                      )}
                      {item.link && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-violet-400">Open</span>
                        </>
                      )}
                    </span>
                  </button>

                  <IconButton
                    icon={Trash2}
                    label="Delete notification"
                    onClick={() => remove(item._id)}
                    className="shrink-0 hover:text-accent-rose"
                  />
                </li>
              );
            })}
          </ul>

          <Pagination meta={meta} onChange={setPage} className="border-t border-ink-700/70 pt-6" />
        </>
      )}
    </div>
  );
}
