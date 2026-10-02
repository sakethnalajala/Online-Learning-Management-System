import { forwardRef, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import {
  AlertCircle,
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Loader2,
  RefreshCw,
  Star,
  X,
} from 'lucide-react';
import { initials } from '../../utils/format';
import { assetUrl } from '../../api/client';

/* ── Spinner / loading ───────────────────────────────────────────────────── */

export function Spinner({ className = 'h-5 w-5' }) {
  return <Loader2 className={clsx('animate-spin text-violet-400', className)} aria-hidden="true" />;
}

export function PageLoader({ label = 'Loading' }) {
  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center gap-4" role="status">
      <div className="relative">
        <div className="absolute inset-0 animate-pulse-ring rounded-full bg-violet-500/30" />
        <Spinner className="relative h-9 w-9" />
      </div>
      <p className="text-sm font-medium text-slate-500">{label}…</p>
    </div>
  );
}

export function Skeleton({ className = 'h-4 w-full' }) {
  return <div className={clsx('skeleton', className)} aria-hidden="true" />;
}

/** Placeholder grid matching the course-card layout, to avoid layout shift. */
export function CardSkeletonGrid({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="surface-raised overflow-hidden">
          <Skeleton className="aspect-video w-full rounded-none" />
          <div className="space-y-3 p-5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-3/4" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 flex-1" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 5 }) {
  return (
    <div className="space-y-3 p-4 sm:p-6">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={clsx('h-9', c === 0 ? 'w-48' : 'flex-1')} />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ── Buttons ─────────────────────────────────────────────────────────────── */

const VARIANTS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
  success: 'btn-success',
};

export const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size,
    loading = false,
    icon: Icon,
    iconRight: IconRight,
    children,
    className,
    disabled,
    type = 'button',
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={clsx(
        VARIANTS[variant],
        size === 'sm' && 'btn-sm',
        size === 'lg' && 'btn-lg',
        className
      )}
      {...props}
    >
      {loading ? (
        <Spinner className="h-4 w-4 text-current" />
      ) : (
        Icon && <Icon className="h-4 w-4" aria-hidden="true" />
      )}
      {children}
      {IconRight && !loading && <IconRight className="h-4 w-4" aria-hidden="true" />}
    </button>
  );
});

export function IconButton({ icon: Icon, label, className, ...props }) {
  return (
    <button type="button" aria-label={label} title={label} className={clsx('btn-icon', className)} {...props}>
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}

/* ── Form fields ─────────────────────────────────────────────────────────── */

export function Field({ label, error, hint, required, children, className }) {
  return (
    <div className={className}>
      {label && (
        <label className="label">
          {label}
          {required && <span className="ml-0.5 text-accent-rose">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="field-error">
          <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      ) : (
        hint && <p className="hint">{hint}</p>
      )}
    </div>
  );
}

export const Input = forwardRef(function Input({ error, className, ...props }, ref) {
  return <input ref={ref} className={clsx('input', error && 'input-error', className)} {...props} />;
});

export const Textarea = forwardRef(function Textarea({ error, className, ...props }, ref) {
  return <textarea ref={ref} className={clsx('textarea', error && 'input-error', className)} {...props} />;
});

export const Select = forwardRef(function Select({ error, className, children, ...props }, ref) {
  return (
    <select ref={ref} className={clsx('select', error && 'input-error', className)} {...props}>
      {children}
    </select>
  );
});

export function Checkbox({ label, description, className, ...props }) {
  const id = useId();
  return (
    <label htmlFor={id} className={clsx('flex cursor-pointer items-start gap-3', className)}>
      <input id={id} type="checkbox" className="checkbox mt-0.5" {...props} />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-slate-200">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-slate-500">{description}</span>}
      </span>
    </label>
  );
}

export function Toggle({ checked, onChange, label, description, disabled }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-200">{label}</p>
        {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={clsx(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
          checked ? 'bg-violet-600' : 'bg-ink-600',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <span
          className={clsx(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ease-premium',
            checked ? 'translate-x-5.5' : 'translate-x-0.5'
          )}
          style={{ transform: `translateX(${checked ? 22 : 2}px)` }}
        />
      </button>
    </div>
  );
}

/* ── Cards, badges, avatars ──────────────────────────────────────────────── */

export function Card({ className, interactive = false, children, ...props }) {
  return (
    <div className={clsx(interactive ? 'surface-interactive' : 'surface-raised', className)} {...props}>
      {children}
    </div>
  );
}

export function Badge({ tone = 'violet', icon: Icon, children, className }) {
  return (
    <span className={clsx(`badge-${tone}`, className)}>
      {Icon && <Icon className="h-3 w-3" aria-hidden="true" />}
      {children}
    </span>
  );
}

export function Avatar({ src, name, size = 'md', className, ring = false }) {
  const sizes = {
    xs: 'h-6 w-6 text-2xs',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-base',
    xl: 'h-20 w-20 text-xl',
    '2xl': 'h-28 w-28 text-3xl',
  };

  const resolved = assetUrl(src);
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={clsx(
        'relative shrink-0 overflow-hidden rounded-full bg-violet-gradient',
        'flex items-center justify-center font-bold text-white',
        sizes[size],
        ring && 'ring-2 ring-violet-500/40 ring-offset-2 ring-offset-ink-900',
        className
      )}
      title={name}
    >
      {resolved && !failed ? (
        <img
          src={resolved}
          alt={name || ''}
          loading="lazy"
          className="h-full w-full object-cover"
          // A dead avatar URL falls back to initials rather than an empty disc.
          onError={() => setFailed(true)}
        />
      ) : (
        <span aria-hidden="true">{initials(name)}</span>
      )}
    </div>
  );
}

/* ── Progress ────────────────────────────────────────────────────────────── */

export function ProgressBar({ value = 0, size = 'md', showLabel = false, label, className, tone }) {
  const pct = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  const heights = { xs: 'h-1', sm: 'h-1.5', md: 'h-2.5', lg: 'h-3.5' };

  const fill =
    tone === 'emerald'
      ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
      : pct === 100
        ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
        : 'bg-violet-gradient';

  return (
    <div className={className}>
      {(showLabel || label) && (
        <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
          <span className="font-medium text-slate-400">{label || 'Progress'}</span>
          <span className={clsx('font-bold', pct === 100 ? 'text-accent-emerald' : 'text-violet-300')}>
            {pct}%
          </span>
        </div>
      )}
      <div
        className={clsx('w-full overflow-hidden rounded-full bg-ink-700', heights[size])}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || 'Progress'}
      >
        <div
          className={clsx('h-full rounded-full transition-all duration-700 ease-premium', fill)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/** Circular progress, used on the student dashboard hero. */
export function ProgressRing({ value = 0, size = 96, stroke = 8, children }) {
  const pct = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const done = pct === 100;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          className="stroke-ink-700"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={clsx(
            'transition-all duration-1000 ease-premium',
            done ? 'stroke-emerald-400' : 'stroke-violet-500'
          )}
          fill="none"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children ?? (
          <span className={clsx('font-display text-xl font-bold', done ? 'text-accent-emerald' : 'text-white')}>
            {pct}%
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Stat card ───────────────────────────────────────────────────────────── */

const STAT_TONES = {
  violet: 'from-violet-600/20 text-violet-300',
  cyan: 'from-cyan-500/20 text-cyan-300',
  emerald: 'from-emerald-500/20 text-emerald-300',
  amber: 'from-amber-500/20 text-amber-300',
  pink: 'from-pink-500/20 text-pink-300',
  rose: 'from-rose-500/20 text-rose-300',
};

export function StatCard({ label, value, icon: Icon, tone = 'violet', hint, trend, className }) {
  return (
    <div className={clsx('surface-raised relative overflow-hidden p-5', className)}>
      <div
        className={clsx(
          'pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br to-transparent blur-2xl',
          STAT_TONES[tone]
        )}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          {/* Wraps rather than truncates: two narrow columns on a phone cut
              labels like "Certificates" in half otherwise. */}
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
          <p className="mt-2 font-display text-3xl font-bold text-white">{value}</p>
          {hint && <p className="mt-1.5 text-xs leading-snug text-slate-500">{hint}</p>}
          {trend != null && (
            <p
              className={clsx(
                'mt-1.5 text-xs font-semibold',
                trend >= 0 ? 'text-accent-emerald' : 'text-accent-rose'
              )}
            >
              {trend >= 0 ? '+' : ''}
              {trend}% vs last period
            </p>
          )}
        </div>
        {Icon && (
          <div
            className={clsx(
              'grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br to-transparent',
              STAT_TONES[tone]
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Empty / error states ────────────────────────────────────────────────── */

export function EmptyState({ icon: Icon = Inbox, title, description, action, className }) {
  return (
    <div className={clsx('flex flex-col items-center justify-center px-6 py-16 text-center', className)}>
      <div className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-violet-soft ring-1 ring-inset ring-violet-500/20">
        <Icon className="h-7 w-7 text-violet-400" aria-hidden="true" />
      </div>
      <h3 className="mb-2 text-lg">{title}</h3>
      {description && <p className="mb-6 max-w-md text-sm leading-relaxed text-slate-400">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry, className }) {
  return (
    <div className={clsx('flex flex-col items-center justify-center px-6 py-16 text-center', className)}>
      <div className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-rose-500/10 ring-1 ring-inset ring-rose-500/25">
        <AlertTriangle className="h-7 w-7 text-accent-rose" aria-hidden="true" />
      </div>
      <h3 className="mb-2 text-lg">Something went wrong</h3>
      <p className="mb-6 max-w-md text-sm leading-relaxed text-slate-400">
        {message || 'We could not load this content.'}
      </p>
      {onRetry && (
        <Button variant="secondary" icon={RefreshCw} onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function InlineAlert({ tone = 'violet', icon: Icon = AlertCircle, title, children, className }) {
  const tones = {
    violet: 'border-violet-500/30 bg-violet-500/10 text-violet-200',
    amber: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
    rose: 'border-rose-500/30 bg-rose-500/10 text-rose-200',
    emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
    cyan: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200',
  };

  return (
    <div className={clsx('flex gap-3 rounded-xl border p-4 text-sm', tones[tone], className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title && <p className="mb-1 font-semibold">{title}</p>}
        <div className="leading-relaxed opacity-90">{children}</div>
      </div>
    </div>
  );
}

/* ── Modal ───────────────────────────────────────────────────────────────── */

export function Modal({ open, onClose, title, description, children, footer, size = 'md' }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const onKey = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);

    // Lock background scroll while the dialog is up.
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    panelRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 animate-fade-in bg-ink-950/80 backdrop-blur-sm"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={clsx(
          'relative flex max-h-[92vh] w-full animate-scale-in flex-col',
          'rounded-t-3xl border border-ink-700 bg-ink-850 shadow-glow-lg sm:rounded-2xl',
          sizes[size]
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink-700 p-5 sm:p-6">
          <div className="min-w-0">
            <h3 className="text-lg">{title}</h3>
            {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
          </div>
          <IconButton icon={X} label="Close" onClick={onClose} className="-mr-1 -mt-1" />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">{children}</div>

        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-ink-700 p-5 sm:flex-row sm:justify-end sm:p-6">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Confirm',
  tone = 'danger',
  loading = false,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant={tone} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-slate-300">{description}</p>
    </Modal>
  );
}

/* ── Star rating ─────────────────────────────────────────────────────────── */

export function StarRating({ value = 0, count, size = 'md', interactive = false, onChange, className }) {
  const sizes = { sm: 'h-3.5 w-3.5', md: 'h-4 w-4', lg: 'h-6 w-6' };
  const rounded = Math.round(Number(value) || 0);

  return (
    <div className={clsx('flex items-center gap-1.5', className)}>
      <div className="flex" role={interactive ? 'radiogroup' : 'img'} aria-label={`${value} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = interactive ? star <= rounded : star <= Math.round(Number(value) || 0);
          const Wrapper = interactive ? 'button' : 'span';
          return (
            <Wrapper
              key={star}
              {...(interactive
                ? {
                    type: 'button',
                    onClick: () => onChange?.(star),
                    'aria-label': `${star} star${star > 1 ? 's' : ''}`,
                    'aria-checked': star === rounded,
                    role: 'radio',
                    className: 'p-0.5 transition-transform hover:scale-125',
                  }
                : { className: 'p-px' })}
            >
              <Star
                className={clsx(
                  sizes[size],
                  filled ? 'fill-accent-amber text-accent-amber' : 'fill-none text-ink-500'
                )}
                aria-hidden="true"
              />
            </Wrapper>
          );
        })}
      </div>
      {value > 0 && <span className="text-sm font-bold text-accent-amber">{Number(value).toFixed(1)}</span>}
      {count != null && <span className="text-xs text-slate-500">({count})</span>}
    </div>
  );
}

/* ── Pagination ──────────────────────────────────────────────────────────── */

export function Pagination({ meta, onChange, className }) {
  if (!meta || meta.totalPages <= 1) return null;

  const { page, totalPages, total } = meta;

  // Compact window of page numbers around the current page.
  const pages = [];
  const window = 1;
  for (let i = 1; i <= totalPages; i += 1) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= window) pages.push(i);
    else if (pages[pages.length - 1] !== '…') pages.push('…');
  }

  return (
    <nav
      className={clsx('flex flex-wrap items-center justify-between gap-4', className)}
      aria-label="Pagination"
    >
      <p className="text-xs text-slate-500">
        Page <span className="font-semibold text-slate-300">{page}</span> of {totalPages} · {total} total
      </p>
      <div className="flex items-center gap-1">
        <IconButton
          icon={ChevronLeft}
          label="Previous page"
          disabled={!meta.hasPrevPage}
          onClick={() => onChange(page - 1)}
          className="disabled:opacity-35"
        />
        {pages.map((item, index) =>
          item === '…' ? (
            <span key={`gap-${index}`} className="px-1 text-xs text-slate-600">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onChange(item)}
              aria-current={item === page ? 'page' : undefined}
              className={clsx(
                'h-9 min-w-9 rounded-lg px-2.5 text-sm font-semibold transition-colors',
                item === page
                  ? 'bg-violet-600 text-white'
                  : 'text-slate-400 hover:bg-ink-750 hover:text-white'
              )}
            >
              {item}
            </button>
          )
        )}
        <IconButton
          icon={ChevronRight}
          label="Next page"
          disabled={!meta.hasNextPage}
          onClick={() => onChange(page + 1)}
          className="disabled:opacity-35"
        />
      </div>
    </nav>
  );
}

/* ── Tabs ────────────────────────────────────────────────────────────────── */

export function Tabs({ tabs, active, onChange, className }) {
  return (
    <div className={clsx('no-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0', className)}>
      <div
        className="flex w-max min-w-full gap-1 border-b border-ink-700"
        role="tablist"
      >
        {tabs.map((tab) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onChange(tab.id)}
              className={clsx(
                'relative flex shrink-0 items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors',
                selected ? 'text-white' : 'text-slate-500 hover:text-slate-300'
              )}
            >
              {tab.icon && <tab.icon className="h-4 w-4" aria-hidden="true" />}
              {tab.label}
              {tab.count != null && (
                <span
                  className={clsx(
                    'rounded-full px-1.5 py-0.5 text-2xs font-bold',
                    selected ? 'bg-violet-500/25 text-violet-200' : 'bg-ink-700 text-slate-500'
                  )}
                >
                  {tab.count}
                </span>
              )}
              {selected && (
                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-violet-gradient" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Misc ────────────────────────────────────────────────────────────────── */

export function SectionHeading({ eyebrow, title, description, action, className }) {
  return (
    <div className={clsx('flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-violet-400">{eyebrow}</p>
        )}
        <h2 className="text-2xl sm:text-3xl">{title}</h2>
        {description && <p className="mt-2 max-w-2xl text-sm text-slate-400">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function CheckPill({ children }) {
  return (
    <li className="flex items-start gap-2.5 text-sm text-slate-300">
      <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-violet-500/20">
        <Check className="h-2.5 w-2.5 text-violet-300" aria-hidden="true" />
      </span>
      <span className="leading-relaxed">{children}</span>
    </li>
  );
}
