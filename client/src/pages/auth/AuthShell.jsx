import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { Award, BarChart3, ListChecks } from 'lucide-react';
import Brand from '../../components/layout/Brand';
import ThemeToggle from '../../components/layout/ThemeToggle';
import BackButton from '../../components/layout/BackButton';
import { ACCENT_CLASSES, roleMeta } from '../../utils/roles';

const HIGHLIGHTS = [
  { icon: BarChart3, text: 'Progress computed from lessons you actually completed' },
  { icon: ListChecks, text: 'Quizzes graded on the server, retakes welcome' },
  { icon: Award, text: 'Certificates with a public verification code' },
];

/** Role-specific copy for the side panel, so the portal you chose is obvious. */
const SIDE_COPY = {
  student: {
    heading: ['Learn something', 'you can prove'],
    body: 'Structured courses, progress tracked against real lesson completion, and a certificate at the end that anyone can verify.',
  },
  instructor: {
    heading: ['Teach what', 'you actually know'],
    body: 'Build a course as modules and lessons, write quizzes that are graded server-side, and see exactly where your students get stuck.',
  },
  admin: {
    heading: ['Run the platform', 'with real numbers'],
    body: 'Review and approve courses before they reach students, manage users and categories, and monitor what the platform is actually doing.',
  },
};

/** Split layout shared by login, register and the role picker. */
export default function AuthShell({ title, subtitle, badge, role, children, footer }) {
  const meta = role ? roleMeta(role) : null;
  const accent = meta ? ACCENT_CLASSES[meta.accent] : null;
  const copy = SIDE_COPY[role] || SIDE_COPY.student;

  return (
    <div className="flex min-h-screen">
      <div className="flex w-full flex-col px-4 py-6 sm:px-8 lg:w-[54%] lg:px-12 xl:px-20">
        <div className="flex items-center justify-between gap-4">
          <Brand />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <BackButton to="/" label="Back" subtle className="hidden sm:inline-flex" />
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          {badge && <div className="mb-4">{badge}</div>}
          <h1 className="text-3xl">{title}</h1>
          {subtitle && <p className="mt-2.5 text-sm leading-relaxed text-slate-400">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>

        {footer && <div className="mx-auto w-full max-w-md text-center">{footer}</div>}
      </div>

      {/* Decorative panel, hidden on small screens where it would only push
          the form down. No grid overlay — just the brand wash. */}
      <aside className="relative hidden overflow-hidden border-l border-ink-700/70 bg-ink-950/50 lg:block lg:w-[46%]">
        <div className="absolute inset-0 bg-hero-glow" aria-hidden="true" />

        <div className="relative flex h-full flex-col justify-center px-12 xl:px-16">
          {meta && (
            <span
              className={clsx(
                'badge mb-6 inline-flex w-fit items-center gap-1.5 ring-1 ring-inset',
                accent.icon
              )}
            >
              <meta.icon className="h-3 w-3" aria-hidden="true" />
              {meta.label}
            </span>
          )}

          <h2 className="text-3xl leading-tight xl:text-4xl">
            {copy.heading[0]}
            <br />
            <span className="text-gradient">{copy.heading[1]}</span>
          </h2>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-slate-400">{copy.body}</p>

          <ul className="mt-10 space-y-4">
            {HIGHLIGHTS.map((item) => (
              <li key={item.text} className="flex items-start gap-3.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-soft text-violet-300 ring-1 ring-inset ring-violet-500/20">
                  <item.icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="pt-2 text-sm leading-snug text-slate-300">{item.text}</span>
              </li>
            ))}
          </ul>

          <p className="mt-10 text-xs text-slate-600">
            Not the right portal?{' '}
            <Link to="/login" className="font-semibold text-violet-300 hover:text-violet-400">
              See all sign-in options
            </Link>
          </p>
        </div>
      </aside>
    </div>
  );
}
