import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { ArrowLeft } from 'lucide-react';

/**
 * Consistent back navigation for every portal.
 *
 * Prefers real history so the user returns to wherever they actually came
 * from — a course opened from "My Courses" goes back there, the same course
 * opened from search goes back to the search results. When there is no history
 * to pop (deep link, refresh, new tab) it falls back to the page's logical
 * parent, so the control is never a dead end.
 *
 * `location.key === 'default'` is React Router's marker for "this is the first
 * entry in this session's history stack", which is exactly the deep-link case.
 */
export default function BackButton({ to, label = 'Back', className, subtle = false }) {
  const navigate = useNavigate();
  const location = useLocation();

  const canGoBack = location.key !== 'default';

  const goBack = useCallback(() => {
    if (canGoBack) navigate(-1);
    else navigate(to || '/', { replace: true });
  }, [canGoBack, navigate, to]);

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label={label}
      className={clsx(
        'group inline-flex items-center gap-1.5 rounded-lg text-sm font-medium transition-colors',
        subtle
          ? 'text-slate-500 hover:text-white'
          : '-ml-2 px-2 py-1.5 text-slate-400 hover:bg-ink-800 hover:text-white',
        className
      )}
    >
      <ArrowLeft
        className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5"
        aria-hidden="true"
      />
      {label}
    </button>
  );
}

/**
 * Page header that pairs back navigation with the title block, so every
 * screen in every portal opens the same way.
 */
export function PageHeader({
  backTo,
  backLabel = 'Back',
  eyebrow,
  title,
  description,
  action,
  className,
  showBack = true,
}) {
  return (
    <div className={clsx('space-y-4', className)}>
      {showBack && <BackButton to={backTo} label={backLabel} />}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && (
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-violet-400">
              {eyebrow}
            </p>
          )}
          <h1 className="text-2xl sm:text-3xl">{title}</h1>
          {description && <p className="mt-2 max-w-2xl text-sm text-slate-400">{description}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}
