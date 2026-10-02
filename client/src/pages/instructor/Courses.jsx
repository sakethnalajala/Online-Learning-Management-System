import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import {
  AlertTriangle,
  BookOpen,
  Eye,
  EyeOff,
  Plus,
  Search,
  Send,
  Settings2,
  Trash2,
  Users,
} from 'lucide-react';
import { categoryApi, courseApi } from '../../api/endpoints';
import { assetUrl } from '../../api/client';
import {
  Button,
  CardSkeletonGrid,
  Checkbox,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  InlineAlert,
  Input,
  Modal,
  Pagination,
  Select,
  StarRating,
  Tabs,
  Textarea,
} from '../../components/ui';
import { PageHeader } from '../../components/layout/BackButton';
import { COURSE_STATUS_META, formatDate, formatPrice } from '../../utils/format';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Drafts' },
  { id: 'pending', label: 'In review' },
  { id: 'published', label: 'Live' },
  { id: 'rejected', label: 'Rejected' },
];

const EMPTY_FORM = {
  title: '',
  subtitle: '',
  description: '',
  category: '',
  level: 'beginner',
  language: 'English',
  isFree: true,
  price: '',
  discountPrice: '',
};

export default function InstructorCourses() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const status = params.get('status') || 'all';

  const [courses, setCourses] = useState([]);
  const [meta, setMeta] = useState(null);
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [creating, setCreating] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [actionId, setActionId] = useState(null);

  useEffect(() => {
    categoryApi
      .list()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await courseApi.mine({
        page,
        limit: 12,
        ...(status !== 'all' ? { status } : {}),
        ...(search.trim() ? { search: search.trim() } : {}),
      });
      setCourses(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [status, page, search]);

  useEffect(() => {
    load();
  }, [load]);

  // Debounce the search field.
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const create = async (event) => {
    event.preventDefault();
    setFormErrors({});
    setCreating(true);

    try {
      const payload = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        description: form.description.trim(),
        category: form.category,
        level: form.level,
        language: form.language,
        isFree: form.isFree,
        ...(form.isFree
          ? {}
          : {
              price: Number(form.price) || 0,
              discountPrice: Number(form.discountPrice) || 0,
            }),
      };

      const course = await courseApi.create(payload);
      toast.success('Course created as a draft. Add modules and lessons next.');
      setCreateOpen(false);
      setForm(EMPTY_FORM);
      navigate(`/instructor/courses/${course._id}`);
    } catch (err) {
      setFormErrors(err.errors || {});
      if (!err.errors) toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  /** Submit / publish / unpublish, all with the same optimistic reload. */
  const runAction = async (course, action) => {
    setActionId(course._id);
    try {
      if (action === 'submit') {
        await courseApi.submit(course._id);
        toast.success('Submitted for admin review.');
      } else if (action === 'publish') {
        await courseApi.publish(course._id);
        toast.success('Course is now live for students.');
      } else if (action === 'unpublish') {
        await courseApi.unpublish(course._id);
        toast.success('Course unpublished. Enrolled students keep access.');
      }
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionId(null);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await courseApi.remove(deleteTarget._id);
      toast.success('Course deleted.');
      setDeleteTarget(null);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-7">
      <PageHeader
        backTo="/instructor"
        title="My courses"
        description="Create a course, build its curriculum, then submit it for admin approval."
        action={
          <Button icon={Plus} onClick={() => setCreateOpen(true)}>
            New course
          </Button>
        }
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search your courses…"
            aria-label="Search your courses"
            className="pl-10"
          />
        </div>
      </div>

      <Tabs
        tabs={TABS}
        active={status}
        onChange={(next) => {
          setParams(next === 'all' ? {} : { status: next }, { replace: true });
          setPage(1);
        }}
      />

      {loading ? (
        <CardSkeletonGrid count={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : courses.length === 0 ? (
        <div className="surface-raised">
          <EmptyState
            icon={BookOpen}
            title={status === 'all' ? 'No courses yet' : `No ${status} courses`}
            description={
              status === 'all'
                ? 'Create your first course. It starts as a draft, so nothing is public until you submit it and an admin approves it.'
                : 'Nothing here right now. Try another tab.'
            }
            action={
              status === 'all' ? (
                <Button icon={Plus} onClick={() => setCreateOpen(true)}>
                  Create a course
                </Button>
              ) : (
                <Button variant="secondary" onClick={() => setParams({}, { replace: true })}>
                  View all courses
                </Button>
              )
            }
          />
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {courses.map((course) => {
              const statusMeta = COURSE_STATUS_META[course.status];
              const busy = actionId === course._id;

              return (
                <article key={course._id} className="surface-raised overflow-hidden">
                  <div className="flex flex-col gap-4 p-4 sm:flex-row sm:p-5">
                    <Link
                      to={`/instructor/courses/${course._id}`}
                      className="aspect-video w-full shrink-0 overflow-hidden rounded-xl bg-ink-800 sm:h-28 sm:w-44"
                    >
                      {assetUrl(course.thumbnail) ? (
                        <img
                          src={assetUrl(course.thumbnail)}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="grid h-full place-items-center bg-gradient-to-br from-violet-900/50 to-ink-850">
                          <BookOpen className="h-6 w-6 text-violet-500/60" aria-hidden="true" />
                        </span>
                      )}
                    </Link>

                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        {statusMeta && <span className={statusMeta.className}>{statusMeta.label}</span>}
                        {course.category?.name && (
                          <span className="badge-slate">{course.category.name}</span>
                        )}
                        <span className="badge-slate">{formatPrice(course)}</span>
                      </div>

                      <h3 className="text-base leading-snug">
                        <Link
                          to={`/instructor/courses/${course._id}`}
                          className="transition-colors hover:text-violet-300"
                        >
                          {course.title}
                        </Link>
                      </h3>

                      {course.subtitle && (
                        <p className="mt-1 line-clamp-1 text-sm text-slate-500">{course.subtitle}</p>
                      )}

                      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
                        <span>{course.moduleCount} modules</span>
                        <span>{course.lessonCount} lessons</span>
                        <span>{course.enrollmentCount} students</span>
                        {course.ratingCount > 0 && (
                          <StarRating value={course.ratingAverage} count={course.ratingCount} size="sm" />
                        )}
                        <span>Updated {formatDate(course.updatedAt || course.createdAt)}</span>
                      </div>

                      {course.status === 'rejected' && course.rejectionReason && (
                        <InlineAlert tone="rose" icon={AlertTriangle} title="Changes requested" className="mt-3">
                          {course.rejectionReason}
                        </InlineAlert>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col">
                      <Link to={`/instructor/courses/${course._id}`} className="btn-primary btn-sm">
                        <Settings2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Build
                      </Link>

                      <Link
                        to={`/instructor/courses/${course._id}/students`}
                        className="btn-secondary btn-sm"
                      >
                        <Users className="h-3.5 w-3.5" aria-hidden="true" />
                        Students
                      </Link>

                      {['draft', 'rejected'].includes(course.status) && (
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={Send}
                          loading={busy}
                          onClick={() => runAction(course, 'submit')}
                        >
                          Submit
                        </Button>
                      )}

                      {['approved', 'unpublished'].includes(course.status) && (
                        <Button
                          variant="success"
                          size="sm"
                          icon={Eye}
                          loading={busy}
                          onClick={() => runAction(course, 'publish')}
                        >
                          Publish
                        </Button>
                      )}

                      {course.status === 'published' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={EyeOff}
                          loading={busy}
                          onClick={() => runAction(course, 'unpublish')}
                        >
                          Unpublish
                        </Button>
                      )}

                      <Button
                        variant="danger"
                        size="sm"
                        icon={Trash2}
                        onClick={() => setDeleteTarget(course)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <Pagination meta={meta} onChange={setPage} className="border-t border-ink-700/70 pt-6" />
        </>
      )}

      {/* ── Create modal ───────────────────────────────────────────────── */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create a new course"
        description="You can change all of this later. The course starts as a private draft."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button onClick={create} loading={creating} icon={Plus}>
              Create draft
            </Button>
          </>
        }
      >
        <form onSubmit={create} className="space-y-4">
          <Field label="Course title" required error={formErrors.title} hint="5–140 characters">
            <Input
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              placeholder="e.g. Modern React from Scratch"
              required
              error={formErrors.title}
            />
          </Field>

          <Field label="Subtitle" hint="One line that says what the student will be able to do" error={formErrors.subtitle}>
            <Input
              value={form.subtitle}
              onChange={(event) => setForm({ ...form, subtitle: event.target.value })}
              placeholder="e.g. Build production interfaces with the React model, not against it"
              maxLength={220}
              error={formErrors.subtitle}
            />
          </Field>

          <Field
            label="Description"
            required
            hint={`${form.description.length}/6000 characters — at least 20`}
            error={formErrors.description}
          >
            <Textarea
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              rows={6}
              maxLength={6000}
              placeholder="What does this course cover, who is it for, and what will they be able to do afterwards?"
              required
              error={formErrors.description}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Category" required error={formErrors.category}>
              <Select
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
                required
                error={formErrors.category}
              >
                <option value="">Choose…</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Level" error={formErrors.level}>
              <Select
                value={form.level}
                onChange={(event) => setForm({ ...form, level: event.target.value })}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </Select>
            </Field>

            <Field label="Language" error={formErrors.language}>
              <Input
                value={form.language}
                onChange={(event) => setForm({ ...form, language: event.target.value })}
                error={formErrors.language}
              />
            </Field>
          </div>

          <div className="rounded-xl border border-ink-600 bg-ink-800/50 p-4">
            <Checkbox
              label="This is a free course"
              description="Free courses unlock immediately on enrolment."
              checked={form.isFree}
              onChange={(event) => setForm({ ...form, isFree: event.target.checked })}
            />

            {!form.isFree && (
              <>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field label="Price (INR)" required error={formErrors.price}>
                    <Input
                      type="number"
                      min="1"
                      value={form.price}
                      onChange={(event) => setForm({ ...form, price: event.target.value })}
                      placeholder="2499"
                      required
                      error={formErrors.price}
                    />
                  </Field>
                  <Field label="Discounted price" hint="Optional, must be below the full price" error={formErrors.discountPrice}>
                    <Input
                      type="number"
                      min="0"
                      value={form.discountPrice}
                      onChange={(event) => setForm({ ...form, discountPrice: event.target.value })}
                      placeholder="1499"
                      error={formErrors.discountPrice}
                    />
                  </Field>
                </div>

                <InlineAlert tone="amber" className="mt-4">
                  No payment gateway is connected to this build. Students can enrol in a paid course,
                  but the enrolment is recorded as awaiting payment and the content stays locked until
                  an admin grants access. Nothing pretends a payment happened.
                </InlineAlert>
              </>
            )}
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
        loading={deleting}
        title="Delete this course?"
        description={`"${deleteTarget?.title || ''}" and all of its modules, lessons, resources, quizzes and student progress will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete permanently"
      />
    </div>
  );
}
