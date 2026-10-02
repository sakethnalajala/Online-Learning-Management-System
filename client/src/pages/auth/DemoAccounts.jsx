import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { ArrowRight, Check, Copy, Eye, EyeOff, KeyRound, Sparkles } from 'lucide-react';
import { authApi } from '../../api/endpoints';
import { Button, Spinner } from '../../components/ui';
import { ACCENT_CLASSES, ROLE_ORDER, roleMeta } from '../../utils/roles';

/**
 * Live demo credentials.
 *
 * The list comes from the API, which returns only accounts the seeder actually
 * created and the password that role really has — so the panel can never
 * advertise a login that does not work. Each role has its own password.
 *
 * With `role` set, this renders the single-account panel used by the
 * role-specific login screens; without it, all three are listed.
 */
export default function DemoAccounts({ role, onFill, onUse }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(null);
  const [revealed, setRevealed] = useState(() => new Set());

  useEffect(() => {
    let alive = true;
    setLoading(true);

    authApi
      .demoAccounts(role)
      .then((data) => {
        if (!alive) return;
        setAccounts(
          [...data].sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role))
        );
      })
      .catch(() => alive && setAccounts([]))
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [role]);

  const copy = async (account) => {
    try {
      await navigator.clipboard.writeText(`${account.email} / ${account.password}`);
      setCopied(account.email);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      /* clipboard can be blocked; the credentials are visible anyway */
    }
  };

  const toggleReveal = (email) =>
    setRevealed((current) => {
      const next = new Set(current);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });

  if (loading) {
    return (
      <div className="surface flex items-center justify-center gap-2 p-5 text-sm text-slate-500">
        <Spinner className="h-4 w-4" />
        Loading demo account…
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="surface p-4 text-center text-xs leading-relaxed text-slate-500">
        No demo account found. Run <code className="text-violet-300">npm run seed</code> in the{' '}
        <code className="text-violet-300">server</code> folder to create them.
      </div>
    );
  }

  /* ── Single-role panel, as used on the role login screens ─────────────── */

  if (role && accounts.length === 1) {
    const account = accounts[0];
    const meta = roleMeta(account.role);
    const accent = ACCENT_CLASSES[meta.accent];
    const shown = revealed.has(account.email);

    return (
      <div className="surface overflow-hidden">
        <div className="flex items-start gap-3 border-b border-ink-700 p-4">
          <span
            className={clsx('grid h-9 w-9 shrink-0 place-items-center rounded-xl ring-1', accent.icon)}
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-white">{meta.label} demo</p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
              Try the platform instantly — no signup needed. For evaluation only.
            </p>
          </div>
        </div>

        <dl className="space-y-2 p-4 text-sm">
          <div className="flex items-center gap-3">
            <dt className="w-20 shrink-0 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Email
            </dt>
            <dd className="min-w-0 flex-1 truncate font-mono text-xs text-slate-300">
              {account.email}
            </dd>
          </div>
          <div className="flex items-center gap-3">
            <dt className="w-20 shrink-0 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Password
            </dt>
            <dd className="min-w-0 flex-1 font-mono text-xs text-slate-300">
              {shown ? account.password : '•'.repeat(account.password.length)}
            </dd>
            <button
              type="button"
              onClick={() => toggleReveal(account.email)}
              aria-label={shown ? 'Hide password' : 'Show password'}
              className="btn-icon h-7 w-7 shrink-0"
            >
              {shown ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
        </dl>

        <div className="flex flex-col gap-2 border-t border-ink-700 p-4 sm:flex-row">
          <Button
            variant="secondary"
            size="sm"
            icon={copied === account.email ? Check : KeyRound}
            onClick={() => {
              onFill?.(account);
              copy(account);
            }}
            className="flex-1"
          >
            {copied === account.email ? 'Copied' : 'Fill credentials'}
          </Button>
          <Button size="sm" iconRight={ArrowRight} onClick={() => onUse?.(account)} className="flex-1">
            Use demo account
          </Button>
        </div>
      </div>
    );
  }

  /* ── All roles, as used on the generic login screen ───────────────────── */

  return (
    <div className="surface overflow-hidden">
      <div className="flex items-center gap-2 border-b border-ink-700 px-4 py-3">
        <Sparkles className="h-4 w-4 shrink-0 text-violet-400" aria-hidden="true" />
        <p className="text-sm font-bold text-white">Demo accounts</p>
        <span className="ml-auto text-2xs text-slate-500">Tap to sign in</span>
      </div>

      <ul className="divide-y divide-ink-800">
        {accounts.map((account) => {
          const meta = roleMeta(account.role);
          const accent = ACCENT_CLASSES[meta.accent];
          const justCopied = copied === account.email;

          return (
            <li key={account.email} className="flex items-center gap-3 px-4 py-3">
              <span
                className={clsx('grid h-8 w-8 shrink-0 place-items-center rounded-lg ring-1', accent.icon)}
              >
                <meta.icon className="h-4 w-4" aria-hidden="true" />
              </span>

              <button
                type="button"
                onClick={() => onUse?.(account)}
                className="min-w-0 flex-1 text-left"
                title={`Sign in with the ${meta.label.toLowerCase()} demo account`}
              >
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  {meta.label}
                </span>
                <span className="mt-0.5 block truncate font-mono text-xs text-slate-300">
                  {account.email}
                </span>
                <span className="block truncate font-mono text-xs text-slate-500">
                  {account.password}
                </span>
              </button>

              <button
                type="button"
                onClick={() => copy(account)}
                aria-label={`Copy ${meta.label} credentials`}
                className="btn-icon shrink-0"
              >
                {justCopied ? (
                  <Check className="h-4 w-4 text-accent-emerald" aria-hidden="true" />
                ) : (
                  <Copy className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <p className="border-t border-ink-700 px-4 py-2.5 text-2xs leading-relaxed text-slate-600">
        Real accounts in the database, each role with its own password.
      </p>
    </div>
  );
}
