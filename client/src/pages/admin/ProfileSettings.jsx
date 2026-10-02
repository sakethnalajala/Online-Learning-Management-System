import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import {
  Activity,
  AlertTriangle,
  Camera,
  Check,
  Clock,
  Github,
  Globe,
  KeyRound,
  Linkedin,
  Lock,
  Mail,
  Monitor,
  Moon,
  Phone,
  RotateCcw,
  Save,
  ShieldCheck,
  Sun,
  Twitter,
  User,
  UserCog,
} from 'lucide-react';
import { authApi, userApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { useTheme, THEMES } from '../../context/ThemeContext';
import { PageHeader } from '../../components/layout/BackButton';
import {
  Avatar,
  Badge,
  Button,
  Field,
  InlineAlert,
  Input,
  PageLoader,
  Textarea,
  Toggle,
} from '../../components/ui';
import { formatDate, formatDateTime, timeAgo } from '../../utils/format';
import { readConsolePrefs, writeConsolePrefs } from '../../utils/consolePrefs';

/** Mirrors the server's password rules so they are visible before submitting. */
const PASSWORD_RULES = [
  { test: (v) => v.length >= 8, label: 'At least 8 characters' },
  { test: (v) => /[a-z]/.test(v), label: 'A lowercase letter' },
  { test: (v) => /[A-Z]/.test(v), label: 'An uppercase letter' },
  { test: (v) => /\d/.test(v), label: 'A number' },
];

/** Section wrapper, so every block on the page reads the same way. */
function SettingsSection({ icon: Icon, title, description, tone = 'violet', children, footer }) {
  const tones = {
    violet: 'bg-violet-500/15 text-violet-300 ring-violet-500/25',
    cyan: 'bg-cyan-500/15 text-accent-cyan ring-cyan-500/25',
    amber: 'bg-amber-500/15 text-accent-amber ring-amber-500/25',
    emerald: 'bg-emerald-500/15 text-accent-emerald ring-emerald-500/25',
  };

  return (
    <section className="surface-raised animate-fade-up overflow-hidden">
      <header className="flex items-start gap-4 border-b border-ink-700/70 p-5 sm:p-6">
        <span
          className={clsx(
            'grid h-11 w-11 shrink-0 place-items-center rounded-xl ring-1',
            tones[tone]
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base">{title}</h2>
          {description && (
            <p className="mt-1 text-sm leading-relaxed text-slate-500">{description}</p>
          )}
        </div>
      </header>

      <div className="p-5 sm:p-6">{children}</div>

      {footer && (
        <div className="flex flex-col-reverse gap-2 border-t border-ink-700/70 bg-ink-900/30 p-5 sm:flex-row sm:justify-end sm:p-6">
          {footer}
        </div>
      )}
    </section>
  );
}

/** Read-only fact row for the account overview. */
function Fact({ label, value, hint, tone }) {
  return (
    <div className="rounded-xl border border-ink-700 bg-ink-800/50 p-4">
      <dt className="text-2xs font-bold uppercase tracking-wider text-slate-500">{label}</dt>
      <dd
        className={clsx(
          'mt-1.5 font-display text-base font-bold',
          tone === 'emerald' ? 'text-accent-emerald' : 'text-white'
        )}
      >
        {value}
      </dd>
      {hint && <p className="mt-0.5 text-2xs text-slate-600">{hint}</p>}
    </div>
  );
}

/**
 * Administrator account centre.
 *
 * Deliberately richer than the student and instructor profile page: an admin
 * manages the platform, so this surfaces account standing and security state
 * alongside the editable fields. Everything writes through the same
 * `/api/users/me` and `/api/auth/password` endpoints the other roles use, which
 * derive the target user from the token — an admin cannot edit anyone else from
 * here, and the server would refuse it if the request were forged.
 */
export default function AdminProfileSettings() {
  const { user, patchUser, home } = useAuth();
  const { theme, setTheme } = useTheme();

  const [form, setForm] = useState(null);
  const [baseline, setBaseline] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [uploading, setUploading] = useState(false);
  const fileInput = useRef(null);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [changingPassword, setChangingPassword] = useState(false);

  // Local-only interface preferences. Kept deliberately out of the user
  // document: they describe this browser, not the account.
  const [prefs, setPrefs] = useState(readConsolePrefs);

  useEffect(() => {
    userApi
      .myProfile()
      .then((data) => {
        const next = {
          name: data.name || '',
          headline: data.headline || '',
          bio: data.bio || '',
          phone: data.phone || '',
          website: data.website || '',
          social: {
            linkedin: data.social?.linkedin || '',
            github: data.social?.github || '',
            twitter: data.social?.twitter || '',
          },
        };
        setForm(next);
        setBaseline(next);
      })
      .catch((err) => toast.error(err.message));
  }, []);

  if (!form) return <PageLoader label="Loading your account" />;

  const dirty = JSON.stringify(form) !== JSON.stringify(baseline);

  const set = (field) => (event) => {
    setForm({ ...form, [field]: event.target.value });
    if (errors[field]) setErrors({ ...errors, [field]: undefined });
  };

  const setSocial = (field) => (event) =>
    setForm({ ...form, social: { ...form.social, [field]: event.target.value } });

  // Writing also applies the preference to the document, so the effect is
  // immediate rather than waiting for a reload.
  const savePrefs = (next) => setPrefs(writeConsolePrefs(next));

  const saveProfile = async (event) => {
    event.preventDefault();
    setErrors({});
    setSaving(true);

    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        headline: form.headline.trim(),
        bio: form.bio.trim(),
        phone: form.phone.trim(),
        website: form.website.trim(),
      };
      const updated = await userApi.updateProfile(payload);
      patchUser({ name: updated.name, headline: updated.headline, avatar: updated.avatar });
      setBaseline(payload);
      toast.success('Profile updated.');
    } catch (err) {
      setErrors(err.errors || {});
      if (!err.errors) toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Choose an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Keep avatars under 5MB.');
      return;
    }

    setUploading(true);
    try {
      const data = await userApi.uploadAvatar(file);
      patchUser({ avatar: data.avatar });
      toast.success('Avatar updated.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const passwordChecks = PASSWORD_RULES.map((rule) => ({
    ...rule,
    ok: rule.test(passwordForm.newPassword),
  }));
  const passwordStrong = passwordChecks.every((check) => check.ok);
  const passwordScore = passwordChecks.filter((check) => check.ok).length;
  const mismatch =
    passwordForm.confirmPassword.length > 0 &&
    passwordForm.newPassword !== passwordForm.confirmPassword;

  const changePassword = async (event) => {
    event.preventDefault();
    setPasswordErrors({});

    if (!passwordStrong) {
      setPasswordErrors({ newPassword: 'Please meet all of the password requirements.' });
      return;
    }
    if (mismatch) {
      setPasswordErrors({ confirmPassword: 'Passwords do not match.' });
      return;
    }

    setChangingPassword(true);
    try {
      await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password updated. Other sessions have been signed out.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordErrors(err.errors || {});
      if (!err.errors) toast.error(err.message);
    } finally {
      setChangingPassword(false);
    }
  };

  const strengthLabel = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'][passwordScore];
  const strengthTone = ['bg-accent-rose', 'bg-accent-rose', 'bg-accent-amber', 'bg-accent-amber', 'bg-accent-emerald'][
    passwordScore
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        backTo={home}
        eyebrow="Account centre"
        title="Profile settings"
        description="Your administrator account, its security, and how this console behaves."
      />

      {/* ── Identity header ──────────────────────────────────────────────── */}
      <section className="surface-raised relative animate-fade-up overflow-hidden p-5 sm:p-6">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-violet-600/15 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative flex flex-wrap items-center gap-5">
          <div className="relative">
            <Avatar src={user?.avatar} name={user?.name} size="xl" ring />
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
              aria-label="Change avatar"
              className="text-on-accent absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full bg-violet-600 shadow-lg transition-all hover:scale-105 hover:bg-violet-500 disabled:opacity-60"
            >
              <Camera className="h-4 w-4" aria-hidden="true" />
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              onChange={uploadAvatar}
              className="sr-only"
            />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-xl sm:text-2xl">{user?.name}</h2>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
              <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{user?.email}</span>
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge tone="amber" icon={ShieldCheck}>
                Administrator
              </Badge>
              {user?.status === 'active' ? (
                <Badge tone="emerald" icon={Check}>
                  Active
                </Badge>
              ) : (
                <Badge tone="rose" icon={AlertTriangle}>
                  {user?.status}
                </Badge>
              )}
              {user?.isDemo && <Badge tone="violet">Demo account</Badge>}
            </div>
          </div>
        </div>
      </section>

      {/* ── Account standing ─────────────────────────────────────────────── */}
      <SettingsSection
        icon={Activity}
        tone="cyan"
        title="Account standing"
        description="Read-only facts about this account. Nothing here is editable, by design."
      >
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Fact label="Role" value="Administrator" hint="Platform-wide access" />
          <Fact
            label="Status"
            value={user?.status === 'active' ? 'Active' : user?.status}
            tone={user?.status === 'active' ? 'emerald' : undefined}
            hint={user?.status === 'active' ? 'Sign-in permitted' : 'Sign-in blocked'}
          />
          <Fact
            label="Member since"
            value={formatDate(user?.createdAt)}
            hint={timeAgo(user?.createdAt)}
          />
          <Fact
            label="Last sign-in"
            value={user?.lastLoginAt ? timeAgo(user.lastLoginAt) : 'This session'}
            hint={user?.lastLoginAt ? formatDateTime(user.lastLoginAt) : undefined}
          />
        </dl>

        <InlineAlert tone="violet" icon={Lock} className="mt-5">
          Your session is held in a signed token that the server re-checks on every request. Role,
          status and password changes take effect immediately — they are never trusted from the
          browser. No token, secret or password hash is shown on this page.
        </InlineAlert>
      </SettingsSection>

      {/* ── Profile details ──────────────────────────────────────────────── */}
      <form onSubmit={saveProfile}>
        <SettingsSection
          icon={UserCog}
          title="Administrator profile"
          description="How you appear to instructors and students across the platform."
          footer={
            <>
              <Button
                variant="secondary"
                icon={RotateCcw}
                onClick={() => {
                  setForm(baseline);
                  setErrors({});
                }}
                disabled={!dirty || saving}
              >
                Reset changes
              </Button>
              <Button type="submit" icon={Save} loading={saving} disabled={!dirty}>
                Save changes
              </Button>
            </>
          }
        >
          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Full name" required error={errors.name}>
                <div className="relative">
                  <User
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                    aria-hidden="true"
                  />
                  <Input
                    value={form.name}
                    onChange={set('name')}
                    required
                    error={errors.name}
                    className="pl-10"
                  />
                </div>
              </Field>

              <Field
                label="Email address"
                hint="Changing the sign-in address is an account-recovery operation and is not available here."
              >
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600"
                    aria-hidden="true"
                  />
                  <Input value={user?.email || ''} disabled readOnly className="pl-10" />
                </div>
              </Field>

              <Field label="Title" hint="Shown beside your name" error={errors.headline}>
                <Input
                  value={form.headline}
                  onChange={set('headline')}
                  placeholder="e.g. Platform administrator"
                  maxLength={120}
                  error={errors.headline}
                />
              </Field>

              <Field label="Contact number" hint="Optional" error={errors.phone}>
                <div className="relative">
                  <Phone
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                    aria-hidden="true"
                  />
                  <Input
                    value={form.phone}
                    onChange={set('phone')}
                    placeholder="+91 98765 43210"
                    error={errors.phone}
                    className="pl-10"
                  />
                </div>
              </Field>
            </div>

            <Field
              label="About"
              hint={`${form.bio.length}/600 characters`}
              error={errors.bio}
            >
              <Textarea
                value={form.bio}
                onChange={set('bio')}
                rows={4}
                maxLength={600}
                placeholder="A short note about your role on the platform."
                error={errors.bio}
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Website" error={errors.website}>
                <div className="relative">
                  <Globe
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                    aria-hidden="true"
                  />
                  <Input
                    value={form.website}
                    onChange={set('website')}
                    placeholder="https://"
                    className="pl-10"
                    error={errors.website}
                  />
                </div>
              </Field>

              {[
                { key: 'linkedin', label: 'LinkedIn', icon: Linkedin },
                { key: 'github', label: 'GitHub', icon: Github },
                { key: 'twitter', label: 'Twitter', icon: Twitter },
              ].map((social) => (
                <Field
                  key={social.key}
                  label={social.label}
                  error={errors[`social.${social.key}`]}
                >
                  <div className="relative">
                    <social.icon
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                      aria-hidden="true"
                    />
                    <Input
                      value={form.social[social.key]}
                      onChange={setSocial(social.key)}
                      placeholder="https://"
                      className="pl-10"
                      error={errors[`social.${social.key}`]}
                    />
                  </div>
                </Field>
              ))}
            </div>
          </div>
        </SettingsSection>
      </form>

      {/* ── Security ─────────────────────────────────────────────────────── */}
      <form onSubmit={changePassword}>
        <SettingsSection
          icon={KeyRound}
          tone="amber"
          title="Account security"
          description="Changing your password signs out every other session immediately."
          footer={
            <Button
              type="submit"
              icon={KeyRound}
              loading={changingPassword}
              disabled={user?.isDemo}
            >
              Update password
            </Button>
          }
        >
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-4">
              <Field label="Current password" required error={passwordErrors.currentPassword}>
                <Input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(event) =>
                    setPasswordForm({ ...passwordForm, currentPassword: event.target.value })
                  }
                  autoComplete="current-password"
                  required
                  error={passwordErrors.currentPassword}
                />
              </Field>

              <Field label="New password" required error={passwordErrors.newPassword}>
                <Input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(event) =>
                    setPasswordForm({ ...passwordForm, newPassword: event.target.value })
                  }
                  autoComplete="new-password"
                  required
                  error={passwordErrors.newPassword}
                />
              </Field>

              <Field
                label="Confirm new password"
                required
                error={passwordErrors.confirmPassword || (mismatch ? 'Passwords do not match.' : undefined)}
              >
                <Input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) =>
                    setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })
                  }
                  autoComplete="new-password"
                  required
                  error={passwordErrors.confirmPassword || mismatch}
                />
              </Field>
            </div>

            <div className="rounded-xl border border-ink-700 bg-ink-800/50 p-5">
              <p className="mb-3 text-sm font-semibold text-white">Password strength</p>

              <div className="mb-1.5 flex gap-1.5" aria-hidden="true">
                {[0, 1, 2, 3].map((index) => (
                  <span
                    key={index}
                    className={clsx(
                      'h-1.5 flex-1 rounded-full transition-colors duration-300',
                      index < passwordScore ? strengthTone : 'bg-ink-600'
                    )}
                  />
                ))}
              </div>
              <p
                className={clsx(
                  'mb-4 text-xs font-semibold',
                  passwordScore >= 4
                    ? 'text-accent-emerald'
                    : passwordScore >= 2
                      ? 'text-accent-amber'
                      : 'text-slate-500'
                )}
              >
                {passwordForm.newPassword ? strengthLabel : 'Enter a new password'}
              </p>

              <ul className="space-y-2">
                {passwordChecks.map((check) => (
                  <li
                    key={check.label}
                    className={clsx(
                      'flex items-center gap-2 text-xs transition-colors',
                      check.ok ? 'text-accent-emerald' : 'text-slate-500'
                    )}
                  >
                    <span
                      className={clsx(
                        'grid h-4 w-4 shrink-0 place-items-center rounded-full transition-colors',
                        check.ok ? 'bg-emerald-500/20' : 'bg-ink-700'
                      )}
                    >
                      {check.ok && <Check className="h-2.5 w-2.5" aria-hidden="true" />}
                    </span>
                    {check.label}
                  </li>
                ))}
              </ul>

              <p className="mt-4 flex items-start gap-2 border-t border-ink-700 pt-3.5 text-2xs leading-relaxed text-slate-600">
                <Clock className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
                Passwords are hashed with bcrypt before storage. The server never returns a hash,
                and tokens issued before a change stop working.
              </p>
            </div>
          </div>

          {user?.isDemo && (
            <InlineAlert tone="amber" className="mt-5">
              This is a shared demo account. Changing its password would lock other people out of
              the demo, so the control is disabled.
            </InlineAlert>
          )}
        </SettingsSection>
      </form>

      {/* ── Console preferences ──────────────────────────────────────────── */}
      <SettingsSection
        icon={Monitor}
        tone="emerald"
        title="Console preferences"
        description="How this admin console behaves in your browser. These are per-device and are not stored on the account."
      >
        <div className="space-y-5">
          <div>
            <p className="mb-3 text-sm font-semibold text-slate-200">Appearance</p>
            <div
              role="radiogroup"
              aria-label="Theme"
              className="grid gap-3 sm:grid-cols-2"
            >
              {[
                {
                  value: THEMES.DARK,
                  icon: Moon,
                  label: 'Dark',
                  hint: 'The default. Easier on the eyes for long sessions.',
                },
                {
                  value: THEMES.LIGHT,
                  icon: Sun,
                  label: 'Light',
                  hint: 'Higher contrast in bright rooms and for printing.',
                },
              ].map((option) => {
                const active = theme === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setTheme(option.value)}
                    className={clsx(
                      'flex items-start gap-3 rounded-xl border p-4 text-left transition-all duration-200 ease-premium',
                      active
                        ? 'border-violet-500 bg-violet-600/10 ring-2 ring-violet-500/25'
                        : 'border-ink-600 bg-ink-800/50 hover:border-ink-500'
                    )}
                  >
                    <span
                      className={clsx(
                        'grid h-9 w-9 shrink-0 place-items-center rounded-lg',
                        active ? 'text-on-accent bg-violet-600' : 'bg-ink-700 text-slate-400'
                      )}
                    >
                      <option.icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{option.label}</span>
                        {active && <Check className="h-3.5 w-3.5 text-violet-300" aria-hidden="true" />}
                      </span>
                      <span className="mt-0.5 block text-xs leading-snug text-slate-500">
                        {option.hint}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4 border-t border-ink-700/70 pt-5">
            <Toggle
              label="Compact tables"
              description="Tighter row spacing across the management tables, so more rows fit on screen."
              checked={prefs.compactTables}
              onChange={(value) => savePrefs({ ...prefs, compactTables: value })}
            />
            <Toggle
              label="Reduce motion"
              description="Turn off page and card animations on this device, without changing your system settings."
              checked={prefs.reduceMotion}
              onChange={(value) => savePrefs({ ...prefs, reduceMotion: value })}
            />
          </div>

          <InlineAlert tone="violet" icon={Monitor}>
            Destructive actions always ask for confirmation — deleting a course removes its modules,
            lessons, enrolments, progress and certificates, so that prompt is not optional.
          </InlineAlert>
        </div>
      </SettingsSection>
    </div>
  );
}
