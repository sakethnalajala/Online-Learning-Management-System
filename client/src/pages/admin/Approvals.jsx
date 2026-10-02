import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  Layers,
  ShieldCheck,
  ShieldX,
  User,
} from 'lucide-react';
import { courseApi, adminApi } from '../../api/endpoints';
import { assetUrl } from '../../api/client';
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Field,
  InlineAlert,
  Modal,
  PageLoader,
  Textarea,
} from '../../components/ui';
import { PageHeader } from '../../components/layout/BackButton';
import { LEVEL_META, formatDuration, formatPrice, timeAgo } from '../../utils/format';

export default function Approvals() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState(null);

  const [rejectTarget, setRejectTarget] = useState(null);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setCourses(await adminApi.pendingCourses());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const approve = async (course, publish) => {
    setActionId(course._id);
    try {
      await courseApi.approve(course._id, publish);
      toast.success(
        publish
          ? `"${course.title}" approved and published.`
          : `"${course.title}" approved. The instructor can publish it now.`
      );
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionId(null);
    }
  };

  const reject = async () => {
    setReasonError('');
    if (reason.trim().length < 5) {
      setReasonError('Give the instructor at least a sentence of actionable feedback.');
      return;
    }

    setRejecting(true);
    try {
      await courseApi.reject(rejectTarget._id, reason.trim());
      toast.success('Course rejected and the instructor was notified.');
      setRejectTarget(null);
      setReason('');
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRejecting(false);
    }
  };

  if (loading) return <PageLoader label="Loading the approval queue" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-7">
      <PageHeader
        backTo="/admin"
        eyebrow="Moderation"
        title="Approval queue"
        description="Courses instructors have submitted for review. Approving a course publishes it and makes it discoverable to students."
      />

      {courses.length === 0 ? (
        <div className="surface-raised">
          <EmptyState
            icon={ShieldCheck}
            title="The queue is clear"
            description="No courses are waiting on a decision. Submitted courses will appear here automatically."
            action={
              <Link to="/admin/courses" className="btn-secondary">
                Browse all courses
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <InlineAlert tone="amber" icon={Clock}>
            {courses.length} course{courses.length === 1 ? '' : 's'} awaiting a decision, oldest
            submission first. Review the curriculum before approving — approval makes the course
            immediately available to students.
          </InlineAlert>

          <div className="space-y-5">
            {courses.map((course) => {
              const level = LEVEL_META[course.level] || LEVEL_META.beginner;
              const busy = actionId === course._id;
              const thin = course.publishedLessons < 3;

              return (
                <article key={course._id} className="surface-raised overflow-hidden">
                  <div className="flex flex-col gap-5 p-5 lg:flex-row">
                    <div className="aspect-video w-full shrink-0 overflow-hidden rounded-xl bg-ink-800 lg:h-36 lg:w-56">
                      {assetUrl(course.thumbnail) ? (
                        <img
                          src={assetUrl(course.thumbnail)}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="grid h-full place-items-center bg-gradient-to-br from-violet-900/50 to-ink-850">
                          <Layers className="h-6 w-6 text-violet-500/60" aria-hidden="true" />
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-2.5 flex flex-wrap items-center gap-2">
                        <Badge tone="amber" icon={Clock}>
                          Submitted {timeAgo(course.submittedAt)}
                        </Badge>
                        {course.category?.name && (
                          <span
                            className="badge"
                            style={{
                              background: `${course.category.color}1f`,
                              color: course.category.color,
                            }}
                          >
                            {course.category.name}
                          </span>
                        )}
                        <span className={level.className}>{level.label}</span>
                        <span className="badge-slate">{formatPrice(course)}</span>
                      </div>

                      <h2 className="text-lg leading-snug">{course.title}</h2>
                      {course.subtitle && (
                        <p className="mt-1 text-sm text-slate-400">{course.subtitle}</p>
                      )}

                      <div className="mt-3 flex items-center gap-2.5">
                        <Avatar
                          src={course.instructor?.avatar}
                          name={course.instructor?.name}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-slate-300">
                            {course.instructor?.name}
                          </p>
                          <p className="truncate text-2xs text-slate-600">
                            {course.instructor?.email}
                          </p>
                        </div>
                      </div>

                      <p className="mt-3.5 line-clamp-3 text-sm leading-relaxed text-slate-400">
                        {course.description}
                      </p>

                      <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Layers className="h-3.5 w-3.5" aria-hidden="true" />
                          {course.moduleCount} modules
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                          {course.publishedLessons} published lessons
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                          {formatDuration(course.totalDurationMinutes)}
                        </div>
                      </dl>

                      {thin && (
                        <InlineAlert tone="amber" icon={AlertTriangle} className="mt-4">
                          Only {course.publishedLessons} published lesson
                          {course.publishedLessons === 1 ? '' : 's'}. Worth checking the curriculum is
                          substantial enough for the stated scope before approving.
                        </InlineAlert>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-col gap-2 lg:w-44">
                      <Link
                        to={`/courses/${course.slug || course._id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary btn-sm"
                      >
                        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                        Preview course
                      </Link>

                      <Button
                        variant="success"
                        size="sm"
                        icon={ShieldCheck}
                        loading={busy}
                        onClick={() => approve(course, true)}
                      >
                        Approve &amp; publish
                      </Button>

                      <Button
                        variant="secondary"
                        size="sm"
                        loading={busy}
                        onClick={() => approve(course, false)}
                      >
                        Approve only
                      </Button>

                      <Button
                        variant="danger"
                        size="sm"
                        icon={ShieldX}
                        onClick={() => {
                          setRejectTarget(course);
                          setReason('');
                          setReasonError('');
                        }}
                      >
                        Request changes
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}

      <Modal
        open={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        title="Request changes"
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
            The instructor sees this message on their course page and in a notification. Be specific
            about what needs to change — vague feedback just produces another rejection.
          </InlineAlert>

          <Field label="Reason for rejection" required error={reasonError}>
            <Textarea
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                setReasonError('');
              }}
              rows={5}
              maxLength={600}
              placeholder="e.g. The curriculum only has two lessons for a course described as comprehensive. Please expand module 2 and add the promised project walkthrough."
              autoFocus
              error={reasonError}
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
