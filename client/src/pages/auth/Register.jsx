import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { ArrowLeft, Check, Eye, EyeOff, Mail, User, UserPlus } from 'lucide-react';
import { ACCENT_CLASSES, REGISTERABLE_ROLES, roleMeta } from '../../utils/roles';
import { useAuth, homeFor } from '../../context/AuthContext';
import { Button, Field, Input, InlineAlert } from '../../components/ui';
import AuthShell from './AuthShell';

/** Mirrors the server's password rules so the user sees them before submitting. */
const RULES = [
  { test: (value) => value.length >= 8, label: 'At least 8 characters' },
  { test: (value) => /[a-z]/.test(value), label: 'A lowercase letter' },
  { test: (value) => /[A-Z]/.test(value), label: 'An uppercase letter' },
  { test: (value) => /\d/.test(value), label: 'A number' },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: params.get('role') === 'instructor' ? 'instructor' : 'student',
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (field) => (event) => {
    setForm({ ...form, [field]: event.target.value });
    if (errors[field]) setErrors({ ...errors, [field]: undefined });
    setFormError('');
  };

  const meta = roleMeta(form.role);
  const accent = ACCENT_CLASSES[meta.accent];

  const passwordChecks = RULES.map((rule) => ({ ...rule, ok: rule.test(form.password) }));
  const passwordStrong = passwordChecks.every((check) => check.ok);
  const mismatch = form.confirmPassword.length > 0 && form.password !== form.confirmPassword;

  const submit = async (event) => {
    event.preventDefault();
    setErrors({});
    setFormError('');

    if (!passwordStrong) {
      setErrors({ password: 'Please meet all of the password requirements.' });
      return;
    }
    if (mismatch) {
      setErrors({ confirmPassword: 'Passwords do not match.' });
      return;
    }

    setLoading(true);
    try {
      const user = await register(form);
      toast.success(`Account created. Welcome, ${user.name.split(' ')[0]}.`);
      navigate(homeFor(user.role), { replace: true });
    } catch (error) {
      if (error.errors) setErrors(error.errors);
      else setFormError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      role={form.role}
      badge={
        <Link
          to="/get-started"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-violet-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Change account type
        </Link>
      }
      title="Create your account"
      subtitle="Free to join. No card, no trial timer."
      footer={
        <p className="text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-violet-300 hover:text-violet-200">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        {formError && <InlineAlert tone="rose">{formError}</InlineAlert>}

        {/* The role was chosen on /get-started; show it and allow a change. */}
        <div
          className={clsx(
            'flex items-center gap-3 rounded-xl border p-3.5',
            'border-ink-600 bg-ink-800/60'
          )}
        >
          <span
            className={clsx(
              'grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-1',
              accent.icon
            )}
          >
            <meta.icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-white">
              Creating a {meta.label.toLowerCase()} account
            </span>
            <span className="mt-0.5 block text-xs text-slate-500">{meta.description}</span>
          </span>
          <div className="flex shrink-0 gap-1">
            {REGISTERABLE_ROLES.filter((key) => key !== form.role).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setForm({ ...form, role: key })}
                className="btn-ghost btn-sm"
              >
                Switch to {roleMeta(key).label.toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        <Field label="Full name" required error={errors.name}>
          <div className="relative">
            <User
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              aria-hidden="true"
            />
            <Input
              value={form.name}
              onChange={set('name')}
              placeholder="Your name"
              autoComplete="name"
              required
              error={errors.name}
              className="pl-10"
            />
          </div>
        </Field>

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
              placeholder="Choose a strong password"
              autoComplete="new-password"
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

        {form.password.length > 0 && (
          <ul className="grid grid-cols-2 gap-1.5">
            {passwordChecks.map((check) => (
              <li
                key={check.label}
                className={clsx(
                  'flex items-center gap-1.5 text-xs',
                  check.ok ? 'text-accent-emerald' : 'text-slate-500'
                )}
              >
                <span
                  className={clsx(
                    'grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full',
                    check.ok ? 'bg-emerald-500/20' : 'bg-ink-700'
                  )}
                >
                  {check.ok && <Check className="h-2.5 w-2.5" aria-hidden="true" />}
                </span>
                {check.label}
              </li>
            ))}
          </ul>
        )}

        <Field
          label="Confirm password"
          required
          error={errors.confirmPassword || (mismatch ? 'Passwords do not match.' : undefined)}
        >
          <Input
            type={showPassword ? 'text' : 'password'}
            value={form.confirmPassword}
            onChange={set('confirmPassword')}
            placeholder="Type it again"
            autoComplete="new-password"
            required
            error={errors.confirmPassword || mismatch}
          />
        </Field>

        <Button type="submit" loading={loading} icon={UserPlus} className="w-full" size="lg">
          Create account
        </Button>

        <p className="text-center text-xs leading-relaxed text-slate-600">
          Administrator accounts are granted by an existing admin, so they cannot be created here.
        </p>
      </form>
    </AuthShell>
  );
}
