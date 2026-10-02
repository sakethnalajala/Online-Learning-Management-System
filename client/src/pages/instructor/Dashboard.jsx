import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  GraduationCap,
  Plus,
  Send,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react';
import { certificateApi, courseApi, userApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { assetUrl } from '../../api/client';
import {
  Avatar,
  Button,
  EmptyState,
  ErrorState,
  ProgressBar,
  SectionHeading,
  Skeleton,
  StarRating,
  StatCard,
} from '../../components/ui';
import { PageHeader } from '../../components/layout/BackButton';
import { ChartCard, EmptyChart, MagnitudeBars, ShareDonut } from '../../components/charts';
import { COURSE_STATUS_META, compactNumber, formatDate, timeAgo } from '../../utils/format';

export default function InstructorDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [courses, setCourses] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsData, coursesRes, certs] = await Promise.all([
        userApi.myStats(),
        courseApi.mine({ limit: 50 }),
        certificateApi.issuedByMyCourses().catch(() => []),
      ]);
      setStats(statsData);
      setCourses(coursesRes.data);
      setCertificates(certs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-36 rounded-2xl" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  if (error) return <ErrorState message={error} onRetry={load} />;

  const firstName = user?.name?.split(' ')[0] || 'there';
  const pending = courses.filter((course) => course.status === 'pending');
  const drafts = courses.filter((course) => course.status === 'draft');
  const approvedUnpublished = courses.filter((course) =>
    ['approved', 'unpublished'].includes(course.status)
  );
  const rejected = courses.filter((course) => course.status === 'rejected');

  const enrollmentByCourse = courses
    .filter((course) => course.enrollmentCount > 0)
    .map((course) => ({
      name: course.title.length > 28 ? `${course.title.slice(0, 26)}…` : course.title,
      value: course.enrollmentCount,
    }));

  // Only three slices, which is this palette's validated all-pairs cap.
  const statusSplit = [
    { name: 'Live', value: courses.filter((c) => c.status === 'published').length },
    { name: 'In review', value: pending.length + approvedUnpublished.length },
    { name: 'Draft / rejected', value: drafts.length + rejected.length },
  ].filter((row) => row.value > 0);

  return (
    <div className="space-y-8">
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="surface-raised relative overflow-hidden p-6 sm:p-8">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cyan-500/12 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0">
            <p className="text-sm font-medium text-accent-cyan">Instructor workspace</p>
            <h1 className="mt-1 text-2xl sm:text-3xl">{firstName}</h1>
            <p className="mt-2.5 max-w-lg text-sm leading-relaxed text-slate-400">
              {stats.totalCourses === 0
                ? 'You have not created a course yet. Build one, submit it for review, and it goes live once an admin approves it.'
                : `${stats.publishedCourses} of your ${stats.totalCourses} course${stats.totalCourses === 1 ? '' : 's'} ${stats.publishedCourses === 1 ? 'is' : 'are'} live, with ${stats.totalStudents} enrolment${stats.totalStudents === 1 ? '' : 's'} between them.`}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/instructor/courses" className="btn-primary">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Create a course
              </Link>
              <Link to="/instructor/students" className="btn-secondary">
                <GraduationCap className="h-4 w-4" aria-hidden="true" />
                View students
              </Link>
            </div>
          </div>

          {stats.averageRating > 0 && (
            <div className="rounded-2xl border border-ink-700 bg-ink-800/60 p-5 text-center">
              <p className="font-display text-4xl font-extrabold text-accent-amber">
                {stats.averageRating}
              </p>
              <StarRating value={stats.averageRating} size="sm" className="mt-1.5 justify-center" />
              <p className="mt-1.5 text-2xs font-semibold uppercase tracking-wider text-slate-500">
                Average rating
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── Action needed ──────────────────────────────────────────────── */}
      {(drafts.length > 0 || approvedUnpublished.length > 0 || rejected.length > 0) && (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {drafts.length > 0 && (
            <ActionCard
              tone="slate"
              icon={Clock}
              title={`${drafts.length} draft${drafts.length === 1 ? '' : 's'}`}
              body="Finish the curriculum, then submit for admin review."
              to="/instructor/courses?status=draft"
              cta="Open drafts"
            />
          )}
          {approvedUnpublished.length > 0 && (
            <ActionCard
              tone="cyan"
              icon={Send}
              title={`${approvedUnpublished.length} ready to publish`}
              body="Approved by an admin. Publish to make it visible to students."
              to="/instructor/courses?status=approved"
              cta="Publish now"
            />
          )}
          {rejected.length > 0 && (
            <ActionCard
              tone="rose"
              icon={TrendingUp}
              title={`${rejected.length} need${rejected.length === 1 ? 's' : ''} changes`}
              body="An admin left feedback. Address it and resubmit."
              to="/instructor/courses?status=rejected"
              cta="See feedback"
            />
          )}
        </section>
      )}

      {/* ── Stats ──────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Courses"
          value={stats.totalCourses}
          icon={BookOpen}
          tone="violet"
          hint={`${stats.publishedCourses} live · ${stats.pendingCourses} pending`}
        />
        <StatCard
          label="Students"
          value={compactNumber(stats.totalStudents)}
          icon={Users}
          tone="cyan"
          hint="Total enrolments"
        />
        <StatCard
          label="Completions"
          value={stats.completions}
          icon={CheckCircle2}
          tone="emerald"
          hint={
            stats.totalStudents > 0
              ? `${Math.round((stats.completions / stats.totalStudents) * 100)}% completion rate`
              : 'No enrolments yet'
          }
        />
        <StatCard
          label="Certificates issued"
          value={certificates.length}
          icon={Award}
          tone="amber"
        />
      </section>

      {/* ── Charts ─────────────────────────────────────────────────────── */}
      <section className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <ChartCard
          title="Enrolments by course"
          subtitle="Which of your courses students are actually joining"
          height={Math.max(220, enrollmentByCourse.length * 42)}
          tableData={courses.map((course) => ({
            course: course.title,
            status: COURSE_STATUS_META[course.status]?.label || course.status,
            students: course.enrollmentCount,
          }))}
          tableColumns={[
            { key: 'course', label: 'Course' },
            { key: 'status', label: 'Status' },
            { key: 'students', label: 'Students', align: 'right' },
          ]}
        >
          {enrollmentByCourse.length === 0 ? (
            <EmptyChart message="No enrolments yet — publish a course to start" />
          ) : (
            <MagnitudeBars data={enrollmentByCourse} name="Students" labelWidth={160} />
          )}
        </ChartCard>

        <ChartCard
          title="Course pipeline"
          subtitle="Where your courses sit in the approval workflow"
          height={240}
          tableData={Object.entries(COURSE_STATUS_META).map(([key, meta]) => ({
            status: meta.label,
            count: courses.filter((course) => course.status === key).length,
          }))}
          tableColumns={[
            { key: 'status', label: 'Status' },
            { key: 'count', label: 'Courses', align: 'right' },
          ]}
        >
          {statusSplit.length === 0 ? (
            <EmptyChart message="Create your first course" />
          ) : (
            <ShareDonut data={statusSplit} centerLabel="Courses" />
          )}
        </ChartCard>
      </section>

      {/* ── Course list ────────────────────────────────────────────────── */}
      <section>
        <PageHeader
        backTo="/"
          title="Your courses"
          action={
            <Link to="/instructor/courses" className="text-sm font-semibold text-violet-300 hover:text-violet-200">
              Manage all
            </Link>
          }
        />

        <div className="mt-5">
          {courses.length === 0 ? (
            <div className="surface-raised">
              <EmptyState
                icon={BookOpen}
                title="No courses yet"
                description="Create a course, build it out as modules and lessons, then submit it for approval."
                action={
                  <Link to="/instructor/courses" className="btn-primary">
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Create your first course
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="space-y-3">
              {courses.slice(0, 5).map((course) => {
                const status = COURSE_STATUS_META[course.status];
                return (
                  <div key={course._id} className="surface-raised flex flex-wrap items-center gap-4 p-4">
                    <Link
                      to={`/instructor/courses/${course._id}`}
                      className="h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-ink-800"
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
                          <BookOpen className="h-4 w-4 text-violet-500/60" aria-hidden="true" />
                        </span>
                      )}
                    </Link>

                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/instructor/courses/${course._id}`}
                        className="line-clamp-1 text-sm font-bold text-white transition-colors hover:text-violet-300"
                      >
                        {course.title}
                      </Link>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-2xs text-slate-500">
                        {status && <span className={status.className}>{status.label}</span>}
                        <span>{course.lessonCount} lessons</span>
                        <span>{course.enrollmentCount} students</span>
                        {course.ratingCount > 0 && (
                          <span className="flex items-center gap-1 text-accent-amber">
                            <Star className="h-3 w-3 fill-current" aria-hidden="true" />
                            {course.ratingAverage}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <Link to={`/instructor/courses/${course._id}/students`} className="btn-secondary btn-sm">
                        <Users className="h-3.5 w-3.5" aria-hidden="true" />
                        <span className="hidden sm:inline">Students</span>
                      </Link>
                      <Link to={`/instructor/courses/${course._id}`} className="btn-primary btn-sm">
                        Manage
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── Recent certificates ────────────────────────────────────────── */}
      {certificates.length > 0 && (
        <section>
          <SectionHeading
            title="Recently issued certificates"
            description="Students who completed one of your courses."
            action={
              <Link
                to="/instructor/certificates"
                className="text-sm font-semibold text-violet-300 hover:text-violet-200"
              >
                View all
              </Link>
            }
          />

          <ul className="mt-5 space-y-2.5">
            {certificates.slice(0, 5).map((certificate) => (
              <li key={certificate._id} className="surface flex flex-wrap items-center gap-3 p-4">
                <Avatar src={certificate.student?.avatar} name={certificate.student?.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">
                    {certificate.student?.name || certificate.studentName}
                  </p>
                  <p className="truncate text-xs text-slate-500">{certificate.courseTitle}</p>
                </div>
                <span className="shrink-0 font-mono text-2xs text-violet-300">
                  {certificate.certificateId}
                </span>
                <span className="shrink-0 text-2xs text-slate-600">
                  {timeAgo(certificate.issuedAt)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function ActionCard({ tone, icon: Icon, title, body, to, cta }) {
  const tones = {
    slate: 'border-ink-600 bg-ink-800/60 text-slate-300',
    cyan: 'border-cyan-500/30 bg-cyan-500/[0.07] text-cyan-300',
    rose: 'border-rose-500/30 bg-rose-500/[0.07] text-rose-300',
  };

  return (
    <div className={clsx('rounded-2xl border p-5', tones[tone])}>
      <Icon className="mb-3 h-5 w-5" aria-hidden="true" />
      <p className="text-sm font-bold text-white">{title}</p>
      <p className="mt-1 text-xs leading-relaxed opacity-80">{body}</p>
      <Link to={to} className="mt-4 inline-flex text-xs font-bold uppercase tracking-wider hover:underline">
        {cta} →
      </Link>
    </div>
  );
}
