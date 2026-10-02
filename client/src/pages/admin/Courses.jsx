import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  BookOpen,
  Eye,
  Search,
  ShieldCheck,
  ShieldX,
  Sparkles,
  Star,
  Trash2,
  Users,
} from 'lucide-react';
import { categoryApi, courseApi } from '../../api/endpoints';
import { assetUrl } from '../../api/client';
import {
  Avatar,
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  IconButton,
  InlineAlert,
  Input,
  Modal,
  Pagination,
  Select,
  StarRating,
  Tabs,
  TableSkeleton,
  Textarea,
} from '../../components/ui';
import { PageHeader } from '../../components/layout/BackButton';
import { COURSE_STATUS_META, formatDate, formatPrice, timeAgo } from '../../utils/format';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'published', label: 'Live' },
  { id: 'draft', label: 'Drafts' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'unpublished', label: 'Unpublished' },
];

export default function AdminCourses() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || 'all';

  const [courses, setCourses] = useState([]);
  const [meta, setMeta] = useState(null);
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState(null);

  const [rejectTarget, setRejectTarget] = useState(null);
  const [reason, setReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    categoryApi
      .list({ includeInactive: 'true' })
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await courseApi.adminList({
        page,
        limit: 15,
        ...(status !== 'all' ? { status } : {}),
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(category ? { category } : {}),
      });
      setCourses(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [status, page, search, category]);

  useEffect(() => {
    load();
  }, [load]);

  const approve = async (course) => {
    setActionId(course._id);
    try {
      await courseApi.approve(course._id, true);
      toast.success('Course approved and published.');
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionId(null);
    }
  };

  const toggleFeatured = async (course) => {
    setActionId(course._id);
    try {
      const updated = await courseApi.toggleFeatured(course._id);
      toast.success(updated.isFeatured ? 'Course featured.' : 'Removed from featured.');
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionId(null);
    }
  };

  const reject = async () => {
    if (reason.trim().length < 5) {
      toast.error('Give the instructor a reason of at least a sentence.');
      return;
    }
    setRejecting(true);
    try {
      await courseApi.reject(rejectTarget._id, reason.trim());
      toast.success('Course rejected and the instructor notified.');
      setRejectTarget(null);
      setReason('');
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRejecting(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await courseApi.remove(deleteTarget._id);
      toast.success('Course and all of its data were deleted.');
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
        backTo="/admin"
        eyebrow="Course management"
        title="All courses"
        description="Every course on the platform regardless of status, with approval and moderation controls."
        action={
          <Link to="/admin/approvals" className="btn-secondary">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Approval queue
          </Link>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search courses by title…"
            aria-label="Search courses"
            className="pl-10"
          />
        </div>

        <Select
          value={category}
          onChange={(event) => {
            setCategory(event.target.value);
            setPage(1);
          }}
          aria-label="Filter by category"
          className="sm:w-56"
        >
          <option value="">All categories</option>
          {categories.map((item) => (
            <option key={item._id} value={item._id}>
              {item.name}
            </option>
          ))}
        </Select>
      </div>

      <Tabs
        tabs={TABS.map((item) => ({
          ...item,
          count: item.id === 'all' ? meta?.total : undefined,
        }))}
        active={status}
        onChange={(next) => {
          setParams(next === 'all' ? {} : { status: next }, { replace: true });
          setPage(1);
        }}
      />

      <div className="surface-raised overflow-hidden">
        {loading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : courses.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No courses match"
            description="Try another status tab, a different category, or clear the search."
          />
        ) : (
          <>
            <div className="table-wrap p-4 sm:p-5">
              <table className="table min-w-[860px]">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Instructor</th>
                    <th>Status</th>
                    <th className="text-center">Content</th>
                    <th className="text-center">Students</th>
                    <th className="text-center">Rating</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => {
                    const statusMeta = COURSE_STATUS_META[course.status];
                    const busy = actionId === course._id;

                    return (
                      <tr key={course._id}>
                        <td className="max-w-[18rem]">
                          <div className="flex items-start gap-3">
                            <div className="h-11 w-16 shrink-0 overflow-hidden rounded-lg bg-ink-800">
                              {assetUrl(course.thumbnail) ? (
                                <img
                                  src={assetUrl(course.thumbnail)}
                                  alt=""
                                  loading="lazy"
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="grid h-full place-items-center bg-gradient-to-br from-violet-900/50 to-ink-850">
                                  <BookOpen className="h-3.5 w-3.5 text-violet-500/60" aria-hidden="true" />
                                </span>
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <Link
                                  to={`/courses/${course.slug || course._id}`}
                                  className="line-clamp-2 font-medium text-white transition-colors hover:text-violet-300"
                                >
                                  {course.title}
                                </Link>
                                {course.isFeatured && (
                                  <Sparkles
                                    className="h-3.5 w-3.5 shrink-0 text-accent-amber"
                                    aria-label="Featured"
                                  />
                                )}
                              </div>
                              <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-2xs text-slate-600">
                                {course.category?.name && <span>{course.category.name}</span>}
                                <span aria-hidden="true">·</span>
                                <span>{formatPrice(course)}</span>
                              </p>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="flex items-center gap-2">
                            <Avatar
                              src={course.instructor?.avatar}
                              name={course.instructor?.name}
                              size="xs"
                            />
                            <div className="min-w-0">
                              <p className="truncate text-xs font-medium text-slate-300">
                                {course.instructor?.name}
                              </p>
                              <p className="truncate text-2xs text-slate-600">
                                {course.instructor?.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td>
                          {statusMeta && <span className={statusMeta.className}>{statusMeta.label}</span>}
                          {course.submittedAt && course.status === 'pending' && (
                            <p className="mt-1 text-2xs text-slate-600">
                              {timeAgo(course.submittedAt)}
                            </p>
                          )}
                        </td>

                        <td className="text-center text-xs text-slate-400">
                          {course.moduleCount}m / {course.lessonCount}l
                        </td>

                        <td className="text-center font-medium tabular-nums text-slate-300">
                          {course.enrollmentCount}
                        </td>

                        <td className="text-center">
                          {course.ratingCount > 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-accent-amber">
                              <Star className="h-3 w-3 fill-current" aria-hidden="true" />
                              {course.ratingAverage}
                              <span className="font-normal text-slate-600">({course.ratingCount})</span>
                            </span>
                          ) : (
                            <span className="text-2xs text-slate-600">—</span>
                          )}
                        </td>

                        <td>
                          <div className="flex items-center justify-end gap-0.5">
                            <Link
                              to={`/courses/${course.slug || course._id}`}
                              className="btn-icon"
                              aria-label="View course"
                            >
                              <Eye className="h-4 w-4" aria-hidden="true" />
                            </Link>

                            {course.status === 'pending' && (
                              <>
                                <IconButton
                                  icon={ShieldCheck}
                                  label="Approve and publish"
                                  onClick={() => approve(course)}
                                  disabled={busy}
                                  className="hover:text-accent-emerald"
                                />
                                <IconButton
                                  icon={ShieldX}
                                  label="Reject"
                                  onClick={() => {
                                    setRejectTarget(course);
                                    setReason('');
                                  }}
                                  className="hover:text-accent-rose"
                                />
                              </>
                            )}

                            {course.status === 'published' && (
                              <IconButton
                                icon={Sparkles}
                                label={course.isFeatured ? 'Remove from featured' : 'Feature on landing page'}
                                onClick={() => toggleFeatured(course)}
                                disabled={busy}
                                className={course.isFeatured ? 'text-accent-amber' : 'hover:text-accent-amber'}
                              />
                            )}

                            <Link
                              to={`/instructor/courses/${course._id}/students`}
                              className="btn-icon"
                              aria-label="View students"
                            >
                              <Users className="h-4 w-4" aria-hidden="true" />
                            </Link>

                            <IconButton
                              icon={Trash2}
                              label="Delete course"
                              onClick={() => setDeleteTarget(course)}
                              className="hover:text-accent-rose"
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="border-t border-ink-700/70 p-4 sm:p-5">
              <Pagination meta={meta} onChange={setPage} />
            </div>
          </>
        )}
      </div>

      <Modal
        open={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        title="Reject this course"
        description={rejectTarget?.title}
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejectTarget(null)} disabled={rejecting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={reject} loading={rejecting} icon={ShieldX}>
              Reject and notify
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <InlineAlert tone="violet">
            The instructor is notified and sees this feedback on their course page. They can revise
            and resubmit.
          </InlineAlert>
          <Field label="Reason for rejection" required>
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={5}
              maxLength={600}
              placeholder="Be specific about what needs to change."
              autoFocus
            />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
        loading={deleting}
        title="Delete this course permanently?"
        description={`"${deleteTarget?.title || ''}" will be deleted along with every module, lesson, resource, quiz, enrolment, progress record, review and certificate attached to it. ${
          deleteTarget?.enrollmentCount > 0
            ? `${deleteTarget.enrollmentCount} student(s) will lose their enrolment and certificates. `
            : ''
        }This cannot be undone.`}
        confirmLabel="Delete permanently"
      />
    </div>
  );
}
