import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import {
  BookOpen,
  Eye,
  Ban,
  CheckCircle2,
  GraduationCap,
  Search,
  ShieldCheck,
  Trash2,
  UserCog,
  Users as UsersIcon,
} from 'lucide-react';
import { userApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
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
  ProgressBar,
  Select,
  Skeleton,
  Tabs,
  TableSkeleton,
} from '../../components/ui';
import { PageHeader } from '../../components/layout/BackButton';
import { formatDate, timeAgo } from '../../utils/format';

const TABS = [
  { id: 'all', label: 'All users' },
  { id: 'student', label: 'Students' },
  { id: 'instructor', label: 'Instructors' },
  { id: 'admin', label: 'Admins' },
];

const ROLE_BADGE = {
  student: 'badge-violet',
  instructor: 'badge-cyan',
  admin: 'badge-amber',
};

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [params, setParams] = useSearchParams();
  const role = params.get('role') || 'all';

  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({ role: 'student', status: 'active' });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

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
      const res = await userApi.list({
        page,
        limit: 15,
        ...(role !== 'all' ? { role } : {}),
        ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
        ...(search.trim() ? { search: search.trim() } : {}),
      });
      setUsers(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [role, page, search, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const openEdit = (target) => {
    setEditTarget(target);
    setEditForm({ role: target.role, status: target.status });
  };

  const save = async () => {
    setSaving(true);
    try {
      await userApi.update(editTarget._id, editForm);
      toast.success('User updated.');
      setEditTarget(null);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleSuspend = async (target) => {
    const next = target.status === 'active' ? 'suspended' : 'active';
    try {
      await userApi.update(target._id, { status: next });
      toast.success(next === 'suspended' ? 'Account suspended.' : 'Account reactivated.');
      await load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await userApi.remove(deleteTarget._id);
      toast.success('User deleted.');
      setDeleteTarget(null);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const openDetail = async (target) => {
    setDetail({ user: target });
    setDetailLoading(true);
    try {
      setDetail(await userApi.get(target._id));
    } catch (err) {
      toast.error(err.message);
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-7">
      <PageHeader
        backTo="/admin"
        eyebrow="User management"
        title="Users"
        description="Manage students, instructors and administrators, including roles and account status."
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
            placeholder="Search by name or email…"
            aria-label="Search users"
            className="pl-10"
          />
        </div>

        <Select
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value);
            setPage(1);
          }}
          aria-label="Filter by status"
          className="sm:w-48"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </Select>
      </div>

      <Tabs
        tabs={TABS.map((item) => ({
          ...item,
          count: item.id === 'all' ? meta?.total : undefined,
        }))}
        active={role}
        onChange={(next) => {
          setParams(next === 'all' ? {} : { role: next }, { replace: true });
          setPage(1);
        }}
      />

      <div className="surface-raised overflow-hidden">
        {loading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : users.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title="No users match"
            description="Try a different role tab, status or search term."
          />
        ) : (
          <>
            <div className="table-wrap p-4 sm:p-5">
              <table className="table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th className="text-center">Activity</th>
                    <th>Joined</th>
                    <th>Last login</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((row) => {
                    const isMe = String(row._id) === String(me?._id);

                    return (
                      <tr key={row._id}>
                        <td>
                          <div className="flex items-center gap-2.5">
                            <Avatar src={row.avatar} name={row.name} size="sm" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="truncate font-medium text-white">{row.name}</p>
                                {isMe && <Badge tone="violet">You</Badge>}
                                {row.isDemo && <Badge tone="amber">Demo</Badge>}
                              </div>
                              <p className="truncate text-2xs text-slate-600">{row.email}</p>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className={ROLE_BADGE[row.role]}>{row.role}</span>
                        </td>

                        <td>
                          {row.status === 'active' ? (
                            <span className="badge-emerald">
                              <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                              Active
                            </span>
                          ) : (
                            <span className="badge-rose">
                              <Ban className="h-3 w-3" aria-hidden="true" />
                              Suspended
                            </span>
                          )}
                        </td>

                        <td className="text-center text-xs text-slate-400">
                          {row.role === 'instructor' && `${row.courseCount ?? 0} courses`}
                          {row.role === 'student' && `${row.enrollmentCount ?? 0} enrolments`}
                          {row.role === 'admin' && '—'}
                        </td>

                        <td className="whitespace-nowrap text-xs text-slate-400">
                          {formatDate(row.createdAt)}
                        </td>

                        <td className="whitespace-nowrap text-xs text-slate-400">
                          {row.lastLoginAt ? timeAgo(row.lastLoginAt) : 'never'}
                        </td>

                        <td>
                          <div className="flex items-center justify-end gap-0.5">
                            <IconButton
                              icon={Eye}
                              label="View detail"
                              onClick={() => openDetail(row)}
                            />
                            <IconButton
                              icon={UserCog}
                              label="Edit role and status"
                              onClick={() => openEdit(row)}
                              disabled={row.isDemo || isMe}
                            />
                            <IconButton
                              icon={row.status === 'active' ? Ban : CheckCircle2}
                              label={row.status === 'active' ? 'Suspend account' : 'Reactivate account'}
                              onClick={() => toggleSuspend(row)}
                              disabled={row.isDemo || isMe}
                              className={
                                row.status === 'active' ? 'hover:text-accent-rose' : 'hover:text-accent-emerald'
                              }
                            />
                            <IconButton
                              icon={Trash2}
                              label="Delete user"
                              onClick={() => setDeleteTarget(row)}
                              disabled={row.isDemo || isMe}
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

      {/* ── Edit role / status ─────────────────────────────────────────── */}
      <Modal
        open={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        title="Edit user"
        description={editTarget?.email}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditTarget(null)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving}>
              Save changes
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Role" hint="Promoting to instructor lets this user create courses.">
            <Select
              value={editForm.role}
              onChange={(event) => setEditForm({ ...editForm, role: event.target.value })}
            >
              <option value="student">Student</option>
              <option value="instructor">Instructor</option>
              <option value="admin">Administrator</option>
            </Select>
          </Field>

          <Field label="Account status">
            <Select
              value={editForm.status}
              onChange={(event) => setEditForm({ ...editForm, status: event.target.value })}
            >
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </Select>
          </Field>

          {editForm.role === 'admin' && editTarget?.role !== 'admin' && (
            <InlineAlert tone="amber" icon={ShieldCheck}>
              Administrators have platform-wide access: they can manage every course, user, category
              and enrolment. Only promote someone you trust with that.
            </InlineAlert>
          )}

          {editForm.status === 'suspended' && (
            <InlineAlert tone="rose" icon={Ban}>
              Suspending blocks login immediately and invalidates any session this user currently has
              open.
            </InlineAlert>
          )}
        </div>
      </Modal>

      {/* ── User detail ───────────────────────────────────────────────── */}
      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail?.user?.name || 'User detail'}
        description={detail?.user?.email}
        size="lg"
      >
        {detailLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : detail?.user ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-start gap-4">
              <Avatar src={detail.user.avatar} name={detail.user.name} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={ROLE_BADGE[detail.user.role]}>{detail.user.role}</span>
                  <span className={detail.user.status === 'active' ? 'badge-emerald' : 'badge-rose'}>
                    {detail.user.status}
                  </span>
                  {detail.user.isDemo && <Badge tone="amber">Demo account</Badge>}
                </div>
                {detail.user.headline && (
                  <p className="mt-2 text-sm text-violet-300">{detail.user.headline}</p>
                )}
                <p className="mt-1 text-xs text-slate-500">
                  Joined {formatDate(detail.user.createdAt)} ·{' '}
                  {detail.user.lastLoginAt
                    ? `last login ${timeAgo(detail.user.lastLoginAt)}`
                    : 'never logged in'}
                </p>
              </div>
            </div>

            {detail.user.bio && (
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-400">
                {detail.user.bio}
              </p>
            )}

            {detail.courses && (
              <section>
                <h4 className="mb-2.5 flex items-center gap-2 text-sm font-bold text-white">
                  <BookOpen className="h-4 w-4 text-violet-400" aria-hidden="true" />
                  Courses ({detail.courses.length})
                </h4>
                {detail.courses.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-ink-600 px-4 py-5 text-center text-xs text-slate-500">
                    This instructor has not created a course yet.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {detail.courses.map((course) => (
                      <li
                        key={course._id}
                        className="flex flex-wrap items-center gap-2.5 rounded-xl border border-ink-700 bg-ink-850/70 p-3 text-xs"
                      >
                        <span className="min-w-0 flex-1 truncate text-slate-300">{course.title}</span>
                        <span className="badge-slate shrink-0">{course.status}</span>
                        <span className="shrink-0 text-slate-600">
                          {course.enrollmentCount} students
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {detail.enrollments && (
              <section>
                <h4 className="mb-2.5 flex items-center gap-2 text-sm font-bold text-white">
                  <GraduationCap className="h-4 w-4 text-violet-400" aria-hidden="true" />
                  Enrolments ({detail.enrollments.length})
                </h4>
                {detail.enrollments.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-ink-600 px-4 py-5 text-center text-xs text-slate-500">
                    This student has not enrolled in anything yet.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {detail.enrollments.map((enrollment) => (
                      <li
                        key={enrollment._id}
                        className="rounded-xl border border-ink-700 bg-ink-850/70 p-3"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="min-w-0 flex-1 truncate text-xs text-slate-300">
                            {enrollment.course?.title || 'Deleted course'}
                          </span>
                          <span
                            className={clsx(
                              'shrink-0 text-xs font-bold',
                              enrollment.progress?.isCompleted ? 'text-accent-emerald' : 'text-violet-300'
                            )}
                          >
                            {enrollment.progress?.percentage ?? 0}%
                          </span>
                        </div>
                        <ProgressBar value={enrollment.progress?.percentage ?? 0} size="xs" className="mt-2" />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
        loading={deleting}
        title="Delete this user?"
        description={`${deleteTarget?.name || ''} (${deleteTarget?.email || ''}) will be permanently deleted along with their enrolments. An instructor who still owns courses cannot be deleted — remove or reassign those first.`}
        confirmLabel="Delete user"
      />
    </div>
  );
}
