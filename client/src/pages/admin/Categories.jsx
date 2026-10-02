import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import {
  Atom,
  Binary,
  BookOpen,
  Braces,
  BrainCircuit,
  Briefcase,
  ChartSpline,
  Cloud,
  Code2,
  Coffee,
  Database,
  EyeOff,
  FileCode2,
  FolderTree,
  Hexagon,
  Palette,
  PenTool,
  Pencil,
  Plus,
  Server,
  ShieldCheck,
  Smartphone,
  Terminal,
  Trash2,
  TrendingUp,
  Workflow,
} from 'lucide-react';
import { categoryApi } from '../../api/endpoints';
import {
  Badge,
  Button,
  Checkbox,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  IconButton,
  InlineAlert,
  Input,
  Modal,
  PageLoader,
  Select,
  Textarea,
} from '../../components/ui';
import { PageHeader } from '../../components/layout/BackButton';

/** Icons an admin can choose from, mirroring what the landing page can render. */
const ICON_CHOICES = {
  Atom,
  Binary,
  BookOpen,
  BrainCircuit,
  Braces,
  Briefcase,
  ChartSpline,
  Cloud,
  Code2,
  Coffee,
  Database,
  FileCode2,
  Hexagon,
  Palette,
  PenTool,
  Server,
  ShieldCheck,
  Smartphone,
  Terminal,
  TrendingUp,
  Workflow,
};

const COLOR_CHOICES = [
  '#8b5cf6',
  '#22d3ee',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#6366f1',
  '#ef4444',
  '#a855f7',
];

const EMPTY = { name: '', description: '', icon: 'BookOpen', color: '#8b5cf6', isActive: true };

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modal, setModal] = useState(null); // { mode, category }
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // includeInactive is honoured for admins only, which is what we want here.
      setCategories(await categoryApi.list({ withCounts: 'true', includeInactive: 'true' }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setForm(EMPTY);
    setErrors({});
    setModal({ mode: 'create' });
  };

  const openEdit = (category) => {
    setForm({
      name: category.name,
      description: category.description || '',
      icon: category.icon || 'BookOpen',
      color: category.color || '#8b5cf6',
      isActive: category.isActive,
    });
    setErrors({});
    setModal({ mode: 'edit', category });
  };

  const save = async (event) => {
    event?.preventDefault();
    setErrors({});
    setSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        icon: form.icon,
        color: form.color,
        isActive: form.isActive,
      };

      if (modal.mode === 'edit') {
        await categoryApi.update(modal.category._id, payload);
        toast.success('Category updated.');
      } else {
        await categoryApi.create(payload);
        toast.success('Category created.');
      }

      setModal(null);
      await load();
    } catch (err) {
      setErrors(err.errors || {});
      if (!err.errors) toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await categoryApi.remove(deleteTarget._id);
      toast.success('Category deleted.');
      setDeleteTarget(null);
      await load();
    } catch (err) {
      toast.error(err.message);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <PageLoader label="Loading categories" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const totalCourses = categories.reduce((sum, category) => sum + (category.courseCount || 0), 0);
  const inactive = categories.filter((category) => !category.isActive).length;

  return (
    <div className="space-y-7">
      <PageHeader
        backTo="/admin"
        eyebrow="Platform management"
        title="Categories"
        description="Subject areas instructors assign courses to, and students filter the catalogue by."
        action={
          <Button icon={Plus} onClick={openCreate}>
            New category
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        <div className="surface-raised p-4 text-center">
          <p className="font-display text-2xl font-bold text-white">{categories.length}</p>
          <p className="mt-0.5 text-2xs font-semibold uppercase tracking-wider text-slate-500">
            Categories
          </p>
        </div>
        <div className="surface-raised p-4 text-center">
          <p className="font-display text-2xl font-bold text-white">{totalCourses}</p>
          <p className="mt-0.5 text-2xs font-semibold uppercase tracking-wider text-slate-500">
            Live courses
          </p>
        </div>
        <div className="surface-raised p-4 text-center">
          <p className="font-display text-2xl font-bold text-white">{inactive}</p>
          <p className="mt-0.5 text-2xs font-semibold uppercase tracking-wider text-slate-500">
            Inactive
          </p>
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="surface-raised">
          <EmptyState
            icon={FolderTree}
            title="No categories yet"
            description="Instructors must assign every course to a category, so create at least one before they start building."
            action={
              <Button icon={Plus} onClick={openCreate}>
                Create the first category
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => {
            const Icon = ICON_CHOICES[category.icon] || BookOpen;

            return (
              <article
                key={category._id}
                className={clsx('surface-raised p-5', !category.isActive && 'opacity-60')}
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
                    style={{ background: `${category.color}22`, color: category.color }}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>

                  <div className="flex gap-0.5">
                    <IconButton icon={Pencil} label="Edit category" onClick={() => openEdit(category)} />
                    <IconButton
                      icon={Trash2}
                      label="Delete category"
                      onClick={() => setDeleteTarget(category)}
                      className="hover:text-accent-rose"
                    />
                  </div>
                </div>

                <h3 className="mt-3.5 flex flex-wrap items-center gap-2 text-base">
                  {category.name}
                  {!category.isActive && (
                    <Badge tone="slate" icon={EyeOff}>
                      Inactive
                    </Badge>
                  )}
                </h3>

                {category.description && (
                  <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-slate-400">
                    {category.description}
                  </p>
                )}

                <div className="mt-4 flex items-center justify-between border-t border-ink-700/70 pt-3.5">
                  <span className="text-xs text-slate-500">
                    <span className="font-bold text-white">{category.courseCount || 0}</span> live
                    course{category.courseCount === 1 ? '' : 's'}
                  </span>
                  <code className="font-mono text-2xs text-slate-600">{category.slug}</code>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ── Create / edit modal ────────────────────────────────────────── */}
      <Modal
        open={Boolean(modal)}
        onClose={() => setModal(null)}
        title={modal?.mode === 'edit' ? 'Edit category' : 'New category'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving}>
              {modal?.mode === 'edit' ? 'Save changes' : 'Create category'}
            </Button>
          </>
        }
      >
        <form onSubmit={save} className="space-y-4">
          <Field label="Name" required error={errors.name}>
            <Input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="e.g. Web Development"
              maxLength={60}
              required
              autoFocus
              error={errors.name}
            />
          </Field>

          <Field label="Description" hint="Shown on the category page" error={errors.description}>
            <Textarea
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              rows={3}
              maxLength={400}
              placeholder="What kind of courses belong here?"
              error={errors.description}
            />
          </Field>

          <Field label="Icon" error={errors.icon}>
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-9">
              {Object.entries(ICON_CHOICES).map(([name, Icon]) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setForm({ ...form, icon: name })}
                  aria-label={name}
                  aria-pressed={form.icon === name}
                  className={clsx(
                    'grid aspect-square place-items-center rounded-xl border transition-all',
                    form.icon === name
                      ? 'border-violet-500 bg-violet-600/15 ring-2 ring-violet-500/25'
                      : 'border-ink-600 bg-ink-800/60 hover:border-ink-500'
                  )}
                >
                  <Icon
                    className="h-4 w-4"
                    style={{ color: form.icon === name ? form.color : undefined }}
                    aria-hidden="true"
                  />
                </button>
              ))}
            </div>
          </Field>

          <Field label="Accent colour" error={errors.color}>
            <div className="flex flex-wrap gap-2">
              {COLOR_CHOICES.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm({ ...form, color })}
                  aria-label={`Use ${color}`}
                  aria-pressed={form.color === color}
                  className={clsx(
                    'h-9 w-9 rounded-xl transition-transform',
                    form.color === color
                      ? 'scale-110 ring-2 ring-white/70 ring-offset-2 ring-offset-ink-850'
                      : 'hover:scale-105'
                  )}
                  style={{ background: color }}
                />
              ))}
              <input
                type="color"
                value={form.color}
                onChange={(event) => setForm({ ...form, color: event.target.value })}
                aria-label="Custom colour"
                className="h-9 w-9 cursor-pointer rounded-xl border border-ink-600 bg-transparent"
              />
            </div>
          </Field>

          <div className="rounded-xl border border-ink-600 bg-ink-800/50 p-4">
            <Checkbox
              label="Active"
              description="Inactive categories are hidden from the catalogue and cannot be chosen for new courses."
              checked={form.isActive}
              onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
            />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
        loading={deleting}
        title="Delete this category?"
        description={
          deleteTarget?.courseCount > 0
            ? `"${deleteTarget.name}" is used by ${deleteTarget.courseCount} course(s). The server will refuse the deletion — reassign those courses first, or mark the category inactive instead.`
            : `"${deleteTarget?.name || ''}" will be permanently removed. No courses currently use it.`
        }
        confirmLabel="Delete category"
      />
    </div>
  );
}
