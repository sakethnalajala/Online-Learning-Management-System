import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { Eye, EyeOff, LogIn, Mail, ShieldAlert } from 'lucide-react';
import { useAuth, homeFor } from '../../context/AuthContext';
import { Button, Field, Input, InlineAlert } from '../../components/ui';
import AuthShell from './AuthShell';
import DemoAccounts from './DemoAccounts';
import { ACCENT_CLASSES, ROLE_META, ROLE_ORDER, roleMeta } from '../../utils/roles';

/**
 * Login, in two modes.
 *
 * `/login` is the generic screen with every demo account listed.
 * `/login/:role` is the role-specific screen the homepage links to, with that
 * role's indicator and its own demo account.
 *
 * The role in the URL only steers presentation and the demo panel. The actual
 * role always comes from the server's response, so a student who opens
 * /login/admin still lands in the student dashboard.
 */
export default function Login() {
  const { role: roleParam } = useParams();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const role = ROLE_META[roleParam] ? roleParam : null;
  const meta = role ? roleMeta(role) : null;
  const accent = meta ? ACCENT_CLASSES[meta.accent] : null;

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [roleNotice, setRoleNotice] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (field) => (event) => {
    setForm({ ...form, [field]: event.target.value });
    if (errors[field]) setErrors({ ...errors, [field]: undefined });
    setFormError('');
    setRoleNotice('');
  };

  const finish = (user) => {
    // The server decides the role; if it differs from the screen they used,
    // say so plainly rather than silently redirecting somewhere unexpected.
    if (role && user.role !== role) {
      setRoleNotice(
        `That account is a ${user.role} account, so you have been taken to the ${user.role} dashboard.`
      );
      toast(`Signed in as ${user.role}.`, { icon: 'ℹ️' });
    } else {
      toast.success(`Welcome back, ${user.name.split(' ')[0]}.`);
    }
    navigate(location.state?.from || homeFor(user.role), { replace: true });
  };

  const submit = async (event) => {
    event.preventDefault();
    setErrors({});
    setFormError('');
    setLoading(true);

    try {
      finish(await login(form));
    } catch (error) {
      if (error.errors) setErrors(error.errors);
      else setFormError(error.message);
    } finally {
      setLoading(false);
    }
  };

  /** Fills the form from the demo panel without submitting. */
  const fillDemo = (account) => {
    setForm({ email: account.email, password: account.password });
    setErrors({});
    setFormError('');
    toast.success('Demo credentials filled in.');
  };

  /** Fills and signs straight in. */
  const useDemo = async (account) => {
    setForm({ email: account.email, password: account.password });
    setErrors({});
    setFormError('');
    setLoading(true);

    try {
      finish(await login({ email: account.email, password: account.password }));
    } catch (error) {
      setFormError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      role={role}
      title={meta ? meta.title : 'Welcome back'}
      subtitle={
        meta
          ? `${meta.description} Sign in to continue.`
          : 'Sign in to pick up where you left off.'
      }
      badge={
        meta && (
          <span
            className={clsx(
              'badge inline-flex items-center gap-1.5 ring-1 ring-inset',
              accent.icon
            )}
          >
            <meta.icon className="h-3 w-3" aria-hidden="true" />
            {meta.label} portal
          </span>
        )
      }
      footer={
        <div className="space-y-3">
          {/* Switch portals without going back to the homepage. */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-slate-500">
            <span>Sign in as</span>
            {ROLE_ORDER.map((key) => {
              const other = roleMeta(key);
              const isCurrent = key === role;
              return (
                <Link
                  key={key}
                  to={`/login/${key}`}
                  className={clsx(
                    'rounded-lg px-2 py-1 font-semibold transition-colors',
                    isCurrent
                      ? 'bg-violet-600/20 text-violet-300'
                      : 'text-slate-400 hover:bg-ink-800 hover:text-white'
                  )}
                >
                  {other.label}
                </Link>
              );
            })}
          </div>

          <p className="text-sm text-slate-500">
            New here?{' '}
            <Link to="/get-started" className="font-semibold text-violet-300 hover:text-violet-400">
              Create an account
            </Link>
          </p>
        </div>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        {formError && <InlineAlert tone="rose">{formError}</InlineAlert>}
        {roleNotice && (
          <InlineAlert tone="amber" icon={ShieldAlert}>
            {roleNotice}
          </InlineAlert>
        )}

        <Field label="Email address" required error={errors.email}>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              aria-hidden="true"
            />
            <Input
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="you@example.com"
              autoComplete="email"
              required
              error={errors.email}
              className="pl-10"
            />
          </div>
        </Field>

        <Field label="Password" required error={errors.password}>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={set('password')}
              placeholder="Your password"
              autoComplete="current-password"
              required
              error={errors.password}
              className="pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-white"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>

        <Button type="submit" loading={loading} icon={LogIn} className="w-full" size="lg">
          {meta ? `Sign in as ${meta.label.toLowerCase()}` : 'Sign in'}
        </Button>
      </form>

      <div className="my-7 flex items-center gap-3">
        <span className="h-px flex-1 bg-ink-700" />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">or</span>
        <span className="h-px flex-1 bg-ink-700" />
      </div>

      <DemoAccounts role={role} onFill={fillDemo} onUse={useDemo} />
    </AuthShell>
  );
}
