import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Camera,
  Github,
  Globe,
  KeyRound,
  Linkedin,
  Mail,
  Plus,
  Save,
  Twitter,
  User,
  X,
} from 'lucide-react';
import { authApi, userApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import {
  Avatar,
  Button,
  Field,
  InlineAlert,
  Input,
  PageLoader,
  Tabs,
  Textarea,
} from '../../components/ui';
import { PageHeader } from '../../components/layout/BackButton';
import { formatDate } from '../../utils/format';

const ROLE_LABEL = { student: 'Student', instructor: 'Instructor', admin: 'Administrator' };

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: KeyRound },
];

export default function Profile() {
  const { user, patchUser, isInstructor, home } = useAuth();
  const [tab, setTab] = useState('profile');

  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [skill, setSkill] = useState('');
  const fileInput = useRef(null);
  const [uploading, setUploading] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    userApi
      .myProfile()
      .then((data) =>
        setForm({
          name: data.name || '',
          headline: data.headline || '',
          bio: data.bio || '',
          phone: data.phone || '',
          website: data.website || '',
          expertise: data.expertise || [],
          social: {
            linkedin: data.social?.linkedin || '',
            github: data.social?.github || '',
            twitter: data.social?.twitter || '',
          },
        })
      )
      .catch((err) => toast.error(err.message));
  }, []);

  if (!form) return <PageLoader label="Loading your profile" />;

  const set = (field) => (event) => {
    setForm({ ...form, [field]: event.target.value });
    if (errors[field]) setErrors({ ...errors, [field]: undefined });
  };

  const setSocial = (field) => (event) =>
    setForm({ ...form, social: { ...form.social, [field]: event.target.value } });

  const save = async (event) => {
    event.preventDefault();
    setErrors({});
    setSaving(true);

    try {
      // Empty strings are fine for the API, but trim so a space is not "content".
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

  const addSkill = () => {
    const value = skill.trim();
    if (!value) return;
    if (form.expertise.includes(value)) {
      toast.error('That is already on the list.');
      return;
    }
    if (form.expertise.length >= 20) {
      toast.error('Twenty skills is plenty.');
      return;
    }
    setForm({ ...form, expertise: [...form.expertise, value] });
    setSkill('');
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setPasswordErrors({});

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordErrors({ confirmPassword: 'Passwords do not match.' });
      return;
    }

    setChangingPassword(true);
    try {
      await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password updated.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordErrors(err.errors || {});
      if (!err.errors) toast.error(err.message);
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-7">
      <PageHeader
        backTo={home} title="Profile settings" description="How you appear across the platform." />

      {/* Identity card */}
      <div className="surface-raised p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-5">
          <div className="relative">
            <Avatar src={user?.avatar} name={user?.name} size="xl" ring />
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
              aria-label="Change avatar"
              className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full bg-violet-600 text-white shadow-lg transition-colors hover:bg-violet-500 disabled:opacity-60"
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
            <h2 className="text-xl">{user?.name}</h2>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
              <Mail className="h-3.5 w-3.5" aria-hidden="true" />
              {user?.email}
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <span className="badge-violet">{ROLE_LABEL[user?.role]}</span>
              {user?.isDemo && <span className="badge-amber">Demo account</span>}
              <span className="text-2xs text-slate-600">Joined {formatDate(user?.createdAt)}</span>
            </div>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-600">
          Your email address and role cannot be changed here. Roles are managed by an administrator.
        </p>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'profile' ? (
        <form onSubmit={save} className="space-y-5">
          <div className="surface-raised p-5 sm:p-6">
            <h3 className="mb-5 text-base">Basic details</h3>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Full name" required error={errors.name}>
                <Input value={form.name} onChange={set('name')} required error={errors.name} />
              </Field>

              <Field
                label="Headline"
                hint="A one-line summary shown next to your name"
                error={errors.headline}
              >
                <Input
                  value={form.headline}
                  onChange={set('headline')}
                  placeholder={
                    isInstructor ? 'e.g. Senior Backend Engineer' : 'e.g. CS undergraduate'
                  }
                  maxLength={120}
                  error={errors.headline}
                />
              </Field>

              <Field label="Phone" hint="Optional" error={errors.phone}>
                <Input
                  value={form.phone}
                  onChange={set('phone')}
                  placeholder="+91 98765 43210"
                  error={errors.phone}
                />
              </Field>

              <Field label="Website" hint="Optional" error={errors.website}>
                <div className="relative">
                  <Globe
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                    aria-hidden="true"
                  />
                  <Input
                    value={form.website}
                    onChange={set('website')}
                    placeholder="https://yoursite.com"
                    className="pl-10"
                    error={errors.website}
                  />
                </div>
              </Field>
            </div>

            <Field
              label="Bio"
              hint={`${form.bio.length}/600 characters`}
              error={errors.bio}
              className="mt-5"
            >
              <Textarea
                value={form.bio}
                onChange={set('bio')}
                rows={5}
                maxLength={600}
                placeholder={
                  isInstructor
                    ? 'Tell students who you are and why you are worth learning from.'
                    : 'A short introduction about yourself.'
                }
                error={errors.bio}
              />
            </Field>
          </div>

          {/* Expertise matters most for instructors but is available to all. */}
          <div className="surface-raised p-5 sm:p-6">
            <h3 className="mb-1.5 text-base">Skills and expertise</h3>
            <p className="mb-4 text-xs text-slate-500">
              Shown as tags on your public profile and on your course pages.
            </p>

            <div className="flex gap-2">
              <Input
                value={skill}
                onChange={(event) => setSkill(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addSkill();
                  }
                }}
                placeholder="e.g. React"
                maxLength={40}
              />
              <Button variant="secondary" icon={Plus} onClick={addSkill}>
                Add
              </Button>
            </div>

            {form.expertise.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {form.expertise.map((item) => (
                  <span key={item} className="badge-violet gap-1.5">
                    {item}
                    <button
                      type="button"
                      onClick={() =>
                        setForm({ ...form, expertise: form.expertise.filter((s) => s !== item) })
                      }
                      aria-label={`Remove ${item}`}
                      className="transition-colors hover:text-white"
                    >
                      <X className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="surface-raised p-5 sm:p-6">
            <h3 className="mb-5 text-base">Social links</h3>
            <div className="grid gap-5 sm:grid-cols-3">
              {[
                { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, placeholder: 'https://linkedin.com/in/…' },
                { key: 'github', label: 'GitHub', icon: Github, placeholder: 'https://github.com/…' },
                { key: 'twitter', label: 'Twitter', icon: Twitter, placeholder: 'https://twitter.com/…' },
              ].map((social) => (
                <Field key={social.key} label={social.label} error={errors[`social.${social.key}`]}>
                  <div className="relative">
                    <social.icon
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                      aria-hidden="true"
                    />
                    <Input
                      value={form.social[social.key]}
                      onChange={setSocial(social.key)}
                      placeholder={social.placeholder}
                      className="pl-10"
                      error={errors[`social.${social.key}`]}
                    />
                  </div>
                </Field>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" icon={Save} loading={saving} size="lg">
              Save changes
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={changePassword} className="space-y-5">
          <div className="surface-raised max-w-xl p-5 sm:p-6">
            <h3 className="mb-1.5 text-base">Change password</h3>
            <p className="mb-5 text-xs leading-relaxed text-slate-500">
              Changing your password signs out every other session immediately, because existing
              tokens are invalidated server-side.
            </p>

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

              <Field
                label="New password"
                hint="At least 8 characters, with upper and lower case and a number"
                required
                error={passwordErrors.newPassword}
              >
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

              <Field label="Confirm new password" required error={passwordErrors.confirmPassword}>
                <Input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) =>
                    setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })
                  }
                  autoComplete="new-password"
                  required
                  error={passwordErrors.confirmPassword}
                />
              </Field>
            </div>

            {user?.isDemo && (
              <InlineAlert tone="amber" className="mt-5">
                This is a shared demo account. Changing its password would lock other people out of
                the demo, so please leave it as it is.
              </InlineAlert>
            )}

            <Button
              type="submit"
              icon={KeyRound}
              loading={changingPassword}
              className="mt-5 w-full"
              disabled={user?.isDemo}
            >
              Update password
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
