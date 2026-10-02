import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import {
  Award,
  Bell,
  BellOff,
  BookOpen,
  CheckCheck,
  CircleCheck,
  FilePlus2,
  Megaphone,
  ShieldCheck,
  ShieldX,
  Star,
  UserPlus,
} from 'lucide-react';
import { notificationApi } from '../../api/endpoints';
import { timeAgo } from '../../utils/format';
import { Spinner } from '../ui';

/** Icon + accent per notification type. */
export const NOTIFICATION_META = {
  enrollment: { icon: UserPlus, tone: 'text-violet-300 bg-violet-500/15' },
  new_lesson: { icon: FilePlus2, tone: 'text-cyan-300 bg-cyan-500/15' },
  course_approval: { icon: ShieldCheck, tone: 'text-emerald-300 bg-emerald-500/15' },
  course_rejection: { icon: ShieldX, tone: 'text-rose-300 bg-rose-500/15' },
  course_completion: { icon: CircleCheck, tone: 'text-emerald-300 bg-emerald-500/15' },
  instructor_update: { icon: Megaphone, tone: 'text-amber-300 bg-amber-500/15' },
  certificate: { icon: Award, tone: 'text-amber-300 bg-amber-500/15' },
  review: { icon: Star, tone: 'text-pink-300 bg-pink-500/15' },
  system: { icon: BookOpen, tone: 'text-slate-300 bg-ink-700' },
};

export default function NotificationBell({ notificationsPath }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);
  const navigate = useNavigate();

  const loadCount = useCallback(async () => {
    try {
      const data = await notificationApi.unreadCount();
      setCount(data.count);
    } catch {
      /* the badge is not important enough to surface an error for */
    }
  }, []);

  useEffect(() => {
    loadCount();
    // Light polling keeps the badge fresh without a websocket layer.
    const timer = setInterval(loadCount, 60000);
    return () => clearInterval(timer);
  }, [loadCount]);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return undefined;

    const onClick = (event) => {
      if (!panelRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const openPanel = async () => {
    const next = !open;
    setOpen(next);
    if (!next) return;

    setLoading(true);
    try {
      const res = await notificationApi.list({ limit: 8 });
      setItems(res.data);
      setCount(res.meta?.unreadCount ?? count);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const openNotification = async (item) => {
    setOpen(false);
    if (!item.isRead) {
      try {
        await notificationApi.markRead(item._id);
        setCount((value) => Math.max(0, value - 1));
      } catch {
        /* navigation still matters more than the read flag */
      }
    }
    if (item.link) navigate(item.link);
  };

  const markAll = async () => {
    try {
      await notificationApi.markAllRead();
      setItems((current) => current.map((item) => ({ ...item, isRead: true })));
      setCount(0);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={openPanel}
        aria-label={`Notifications${count > 0 ? `, ${count} unread` : ''}`}
        aria-expanded={open}
        className="btn-icon relative"
      >
        <Bell className="h-[18px] w-[18px]" aria-hidden="true" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent-rose px-1 text-[10px] font-bold text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-2 w-[min(23rem,calc(100vw-2rem))] animate-scale-in overflow-hidden rounded-2xl border border-ink-700 bg-ink-850/97 shadow-glow-lg backdrop-blur-xl"
          role="menu"
        >
          <div className="flex items-center justify-between gap-2 border-b border-ink-700 px-4 py-3">
            <p className="text-sm font-bold text-white">
              Notifications
              {count > 0 && <span className="ml-2 text-xs font-medium text-violet-300">{count} new</span>}
            </p>
            {count > 0 && (
              <button
                type="button"
                onClick={markAll}
                className="flex items-center gap-1 text-xs font-semibold text-violet-300 hover:text-violet-200"
              >
                <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[22rem] overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-10">
                <Spinner />
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <BellOff className="h-6 w-6 text-ink-500" aria-hidden="true" />
                <p className="text-sm text-slate-500">Nothing here yet.</p>
              </div>
            ) : (
              items.map((item) => {
                const meta = NOTIFICATION_META[item.type] || NOTIFICATION_META.system;
                return (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => openNotification(item)}
                    className={clsx(
                      'flex w-full gap-3 border-b border-ink-800/70 px-4 py-3 text-left transition-colors last:border-0 hover:bg-ink-800/60',
                      !item.isRead && 'bg-violet-600/[0.07]'
                    )}
                  >
                    <span className={clsx('mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg', meta.tone)}>
                      <meta.icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start gap-2">
                        <span className="min-w-0 flex-1 text-sm font-semibold text-white">{item.title}</span>
                        {!item.isRead && (
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" aria-label="Unread" />
                        )}
                      </span>
                      {item.message && (
                        <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-slate-400">
                          {item.message}
                        </span>
                      )}
                      <span className="mt-1 block text-2xs text-slate-600">{timeAgo(item.createdAt)}</span>
                    </span>
                  </button>
                );
              })
            )}
          </div>

          <Link
            to={notificationsPath}
            onClick={() => setOpen(false)}
            className="block border-t border-ink-700 px-4 py-3 text-center text-sm font-semibold text-violet-300 transition-colors hover:bg-ink-800 hover:text-violet-200"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
