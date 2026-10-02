import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { ChevronDown, LayoutDashboard, LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui';

const ROLE_LABEL = { student: 'Student', instructor: 'Instructor', admin: 'Administrator' };

export default function UserMenu() {
  const { user, logout, home } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (event) => {
      if (!ref.current?.contains(event.target)) setOpen(false);
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

  if (!user) return null;

  const onLogout = async () => {
    setOpen(false);
    await logout();
    navigate('/');
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label="Account menu"
        className={clsx(
          'flex items-center gap-2 rounded-xl p-1 pr-2 transition-colors',
          open ? 'bg-ink-750' : 'hover:bg-ink-800'
        )}
      >
        <Avatar src={user.avatar} name={user.name} size="sm" />
        <span className="hidden min-w-0 text-left sm:block">
          <span className="block max-w-[9rem] truncate text-sm font-semibold leading-tight text-white">
            {user.name}
          </span>
          <span className="block text-2xs font-medium text-slate-500">{ROLE_LABEL[user.role]}</span>
        </span>
        <ChevronDown
          className={clsx('h-4 w-4 shrink-0 text-slate-500 transition-transform', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-2 w-60 animate-scale-in overflow-hidden rounded-2xl border border-ink-700 bg-ink-850/97 shadow-glow-lg backdrop-blur-xl"
          role="menu"
        >
          <div className="border-b border-ink-700 px-4 py-3.5">
            <p className="truncate text-sm font-bold text-white">{user.name}</p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
            {user.isDemo && (
              <span className="badge-violet mt-2 inline-flex">Demo account</span>
            )}
          </div>

          <div className="p-1.5">
            <Link to={home} onClick={() => setOpen(false)} className="nav-link" role="menuitem">
              <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
              Dashboard
            </Link>
            <Link
              to={`${home}/profile`}
              onClick={() => setOpen(false)}
              className="nav-link"
              role="menuitem"
            >
              <User className="h-4 w-4" aria-hidden="true" />
              Profile settings
            </Link>
          </div>

          <div className="border-t border-ink-700 p-1.5">
            <button
              type="button"
              onClick={onLogout}
              className="nav-link w-full text-accent-rose hover:bg-rose-500/10 hover:text-rose-300"
              role="menuitem"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
