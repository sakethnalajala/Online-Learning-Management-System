import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { ArrowRight, Check, Info, ShieldCheck } from 'lucide-react';
import Brand from '../../components/layout/Brand';
import ThemeToggle from '../../components/layout/ThemeToggle';
import BackButton from '../../components/layout/BackButton';
import { Button, InlineAlert } from '../../components/ui';
import { ACCENT_CLASSES, REGISTERABLE_ROLES, roleMeta } from '../../utils/roles';

/**
 * Role selection, shown before registration.
 *
 * "Get Started" used to drop straight into a form; picking the role first
 * makes the two very different journeys explicit and lets the registration
 * screen open already configured for that choice.
 *
 * Administrator is deliberately absent: admin accounts are granted by an
 * existing admin, and the API refuses a self-assigned admin role regardless of
 * what the client sends.
 */
export default function GetStarted() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState('student');

  const cont = () => navigate(`/register?role=${selected}`);

  return (
    <div className="flex min-h-screen flex-col bg-hero-glow">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-6 sm:px-6">
        <Brand />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link to="/login" className="btn-ghost btn-sm">
            Log in
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-4 py-10 sm:px-6">
        <BackButton to="/" label="Back to home" className="mb-6" />

        <div className="text-center">
          <span className="badge-violet mb-5 inline-flex">Step 1 of 2</span>
          <h1 className="text-3xl sm:text-4xl">How will you use Lumina?</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">
            Pick the account you need. You can always browse the catalogue either way — this just
            decides which workspace you land in.
          </p>
        </div>

        <div
          role="radiogroup"
          aria-label="Account type"
          className="mt-10 grid gap-4 sm:grid-cols-2"
        >
          {REGISTERABLE_ROLES.map((key) => {
            const meta = roleMeta(key);
            const accent = ACCENT_CLASSES[meta.accent];
            const active = selected === key;

            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setSelected(key)}
                onDoubleClick={cont}
                className={clsx(
                  'group relative overflow-hidden rounded-2xl border p-6 text-left transition-all duration-300 ease-premium',
                  active
                    ? clsx('bg-ink-850 ring-2', accent.ring)
                    : 'border-ink-700 bg-ink-850/60 hover:-translate-y-0.5 hover:border-ink-600'
                )}
              >
                {active && (
                  <span
                    className="text-on-accent absolute right-4 top-4 grid h-6 w-6 place-items-center rounded-full bg-violet-600"
                    aria-hidden="true"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </span>
                )}

                <span
                  className={clsx(
                    'mb-5 grid h-14 w-14 place-items-center rounded-2xl ring-1 transition-transform duration-300 group-hover:scale-105',
                    accent.icon
                  )}
                >
                  <meta.icon className="h-7 w-7" aria-hidden="true" />
                </span>

                <span className="block font-display text-xl font-bold text-white">
                  {meta.label}
                </span>
                <span className={clsx('mt-1 block text-sm font-semibold', accent.text)}>
                  {meta.tagline}
                </span>

                <ul className="mt-5 space-y-2">
                  {meta.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2.5 text-sm text-slate-400">
                      <span
                        className={clsx('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full', accent.dot)}
                        aria-hidden="true"
                      />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col items-center gap-4">
          <Button size="lg" iconRight={ArrowRight} onClick={cont} className="w-full sm:w-auto sm:px-12">
            Continue as {roleMeta(selected).label.toLowerCase()}
          </Button>

          <p className="text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-violet-300 hover:text-violet-400">
              Sign in
            </Link>
          </p>
        </div>

        <InlineAlert tone="violet" icon={ShieldCheck} className="mx-auto mt-10 max-w-2xl">
          Administrator accounts are not self-served. They are granted by an existing administrator,
          and the API rejects a self-assigned admin role no matter what the browser sends.
        </InlineAlert>
      </main>
    </div>
  );
}
