import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import {
  Award,
  BookOpen,
  ClipboardList,
  FolderTree,
  GraduationCap,
  Layers,
  ListChecks,
  ShieldCheck,
  Star,
  TrendingUp,
  UserCog,
  Users,
} from 'lucide-react';
import { adminApi } from '../../api/endpoints';
import {
  Avatar,
  Badge,
  EmptyState,
  ErrorState,
  InlineAlert,
  ProgressBar,
  Select,
  Skeleton,
  StarRating,
  StatCard,
} from '../../components/ui';
import { PageHeader } from '../../components/layout/BackButton';
import {
  ChartCard,
  EmptyChart,
  MagnitudeBars,
  Meter,
  ShareDonut,
  TrendArea,
  TrendLines,
} from '../../components/charts';
import { COURSE_STATUS_META, compactNumber, formatDate, timeAgo } from '../../utils/format';

const ACTIVITY_TONE = {
  user: 'text-violet-300 bg-violet-500/15',
  course: 'text-cyan-300 bg-cyan-500/15',
  enrollment: 'text-emerald-300 bg-emerald-500/15',
  certificate: 'text-amber-300 bg-amber-500/15',
  review: 'text-pink-300 bg-pink-500/15',
};

const ACTIVITY_ICON = {
  user: Users,
  course: BookOpen,
  enrollment: GraduationCap,
  certificate: Award,
  review: Star,
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [pending, setPending] = useState([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async (windowDays = days) => {
    setLoading(true);
    setError('');
    try {
      const [statsData, activityData, pendingData] = await Promise.all([
        adminApi.stats(windowDays),
        adminApi.activity().catch(() => []),
        adminApi.pendingCourses().catch(() => []),
      ]);
      setStats(statsData);
      setActivity(activityData);
      setPending(pendingData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(days);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  if (loading && !stats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  if (error) return <ErrorState message={error} onRetry={() => load(days)} />;

  const { totals, courseStatus, approval, trends, signupsByRole, categoryBreakdown, topCourses, topInstructors, recentEnrollments } = stats;

  // Three slices only — the validated all-pairs cap for this palette.
  const userSplit = [
    { name: 'Students', value: totals.students },
    { name: 'Instructors', value: totals.instructors },
    { name: 'Admins', value: totals.admins },
  ].filter((row) => row.value > 0);

  return (
    <div className="space-y-8">
      <PageHeader
        backTo="/"
        eyebrow="Platform overview"
        title="Admin dashboard"
        description="Users, courses, enrolments and the approval pipeline at a glance."
        action={
          <Select
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
            aria-label="Trend window"
            className="w-40"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </Select>
        }
      />

      {/* ── Approval queue callout ─────────────────────────────────────── */}
      {approval.pending > 0 && (
        <InlineAlert tone="amber" icon={ClipboardList} title={`${approval.pending} course${approval.pending === 1 ? '' : 's'} awaiting review`}>
          Instructors are waiting on a decision. Approving a course publishes it and makes it
          discoverable to students immediately.{' '}
          <Link to="/admin/approvals" className="font-bold underline">
            Open the approval queue
          </Link>
          .
        </InlineAlert>
      )}

      {/* ── Primary stats ──────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total users"
          value={compactNumber(totals.users)}
          icon={Users}
          tone="violet"
          hint={`${totals.suspendedUsers} suspended`}
        />
        <StatCard
          label="Students"
          value={compactNumber(totals.students)}
          icon={GraduationCap}
          tone="cyan"
        />
        <StatCard
          label="Instructors"
          value={totals.instructors}
          icon={UserCog}
          tone="pink"
        />
        <StatCard
          label="Courses"
          value={totals.courses}
          icon={BookOpen}
          tone="amber"
          hint={`${courseStatus.published} live`}
        />
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Enrolments"
          value={compactNumber(totals.enrollments)}
          icon={Layers}
          tone="violet"
          hint={`${totals.completedEnrollments} completed`}
        />
        <StatCard
          label="Completion rate"
          value={`${totals.completionRate}%`}
          icon={TrendingUp}
          tone="emerald"
          hint={`${totals.averageProgress}% average progress`}
        />
        <StatCard
          label="Certificates"
          value={totals.certificates}
          icon={Award}
          tone="amber"
        />
        <StatCard
          label="Quiz attempts"
          value={compactNumber(totals.quizAttempts)}
          icon={ListChecks}
          tone="cyan"
          hint={`${totals.lessons} lessons published`}
        />
      </section>

      {/* ── Growth trends ──────────────────────────────────────────────── */}
      <section className="grid gap-5 lg:grid-cols-2">
        <ChartCard
          title="Enrolments over time"
          subtitle={`New enrolments in the last ${trends.days} days`}
          tableData={trends.enrollments
            .filter((row) => row.count > 0)
            .map((row) => ({ date: formatDate(row.date), count: row.count }))}
          tableColumns={[
            { key: 'date', label: 'Date' },
            { key: 'count', label: 'Enrolments', align: 'right' },
          ]}
        >
          {trends.enrollments.every((row) => row.count === 0) ? (
            <EmptyChart message="No enrolments in this window" />
          ) : (
            <TrendArea data={trends.enrollments} name="Enrolments" />
          )}
        </ChartCard>

        <ChartCard
          title="Platform growth"
          subtitle="New users, courses and enrolments side by side"
          tableData={trends.enrollments.map((row, index) => ({
            date: formatDate(row.date),
            users: trends.users[index]?.count ?? 0,
            courses: trends.courses[index]?.count ?? 0,
            enrollments: row.count,
          }))}
          tableColumns={[
            { key: 'date', label: 'Date' },
            { key: 'users', label: 'Users', align: 'right' },
            { key: 'courses', label: 'Courses', align: 'right' },
            { key: 'enrollments', label: 'Enrolments', align: 'right' },
          ]}
        >
          {trends.users.every((row) => row.count === 0) &&
          trends.courses.every((row) => row.count === 0) ? (
            <EmptyChart message="No new activity in this window" />
          ) : (
            <TrendLines
              data={trends.enrollments.map((row, index) => ({
                date: row.date,
                enrollments: row.count,
                users: trends.users[index]?.count ?? 0,
                courses: trends.courses[index]?.count ?? 0,
              }))}
              series={[
                { key: 'enrollments', label: 'Enrolments' },
                { key: 'users', label: 'New users' },
                { key: 'courses', label: 'New courses' },
              ]}
            />
          )}
        </ChartCard>
      </section>

      {/* ── Composition and approval ───────────────────────────────────── */}
      <section className="grid gap-5 lg:grid-cols-3">
        <ChartCard
          title="Users by role"
          subtitle="How the user base splits"
          height={240}
          tableData={userSplit.map((row) => ({ role: row.name, count: row.value }))}
          tableColumns={[
            { key: 'role', label: 'Role' },
            { key: 'count', label: 'Users', align: 'right' },
          ]}
        >
          {userSplit.length === 0 ? <EmptyChart /> : <ShareDonut data={userSplit} centerLabel="Users" />}
        </ChartCard>

        <ChartCard
          title="Course lifecycle"
          subtitle="Courses in each status — the name carries the meaning, not the colour"
          height={260}
          tableData={Object.entries(COURSE_STATUS_META).map(([key, meta]) => ({
            status: meta.label,
            count: courseStatus[key] || 0,
          }))}
          tableColumns={[
            { key: 'status', label: 'Status' },
            { key: 'count', label: 'Courses', align: 'right' },
          ]}
        >
          {totals.courses === 0 ? (
            <EmptyChart message="No courses yet" />
          ) : (
            <MagnitudeBars
              data={Object.entries(COURSE_STATUS_META).map(([key, meta]) => ({
                name: meta.label,
                value: courseStatus[key] || 0,
              }))}
              name="Courses"
              labelWidth={124}
            />
          )}
        </ChartCard>

        <div className="surface-raised space-y-5 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base">Approval pipeline</h3>
              <p className="mt-0.5 text-xs text-slate-500">Moderation throughput</p>
            </div>
            <Link to="/admin/approvals" className="btn-ghost btn-sm">
              Queue
            </Link>
          </div>

          <Meter
            label="Approval rate"
            value={approval.approved}
            total={Math.max(1, approval.reviewed)}
            tone="emerald"
            hint={`${approval.reviewed} course${approval.reviewed === 1 ? '' : 's'} reviewed in total`}
          />

          <dl className="space-y-2.5 border-t border-ink-700/70 pt-4">
            {[
              { label: 'Awaiting review', value: approval.pending, tone: 'badge-amber' },
              { label: 'Approved', value: approval.approved, tone: 'badge-emerald' },
              { label: 'Rejected', value: approval.rejected, tone: 'badge-rose' },
              { label: 'Still in draft', value: approval.draft, tone: 'badge-slate' },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-3 text-sm">
                <dt className="text-slate-400">{row.label}</dt>
                <dd className={row.tone}>{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── Categories ─────────────────────────────────────────────────── */}
      <section className="grid gap-5 lg:grid-cols-2">
        <ChartCard
          title="Courses by category"
          subtitle="Where the catalogue is concentrated"
          height={Math.max(240, categoryBreakdown.length * 40)}
          action={
            <Link to="/admin/categories" className="btn-ghost btn-sm">
              <FolderTree className="h-3.5 w-3.5" aria-hidden="true" />
              Manage
            </Link>
          }
          tableData={categoryBreakdown.map((row) => ({
            category: row.name,
            courses: row.courses,
            enrollments: row.enrollments,
          }))}
          tableColumns={[
            { key: 'category', label: 'Category' },
            { key: 'courses', label: 'Courses', align: 'right' },
            { key: 'enrollments', label: 'Enrolments', align: 'right' },
          ]}
        >
          {categoryBreakdown.length === 0 ? (
            <EmptyChart />
          ) : (
            <MagnitudeBars
              data={categoryBreakdown.map((row) => ({ name: row.name, value: row.courses }))}
              name="Courses"
              labelWidth={130}
            />
          )}
        </ChartCard>

        <ChartCard
          title="Enrolments by category"
          subtitle="What students are actually choosing"
          height={Math.max(240, categoryBreakdown.length * 40)}
          tableData={categoryBreakdown.map((row) => ({
            category: row.name,
            enrollments: row.enrollments,
          }))}
          tableColumns={[
            { key: 'category', label: 'Category' },
            { key: 'enrollments', label: 'Enrolments', align: 'right' },
          ]}
        >
          {categoryBreakdown.every((row) => row.enrollments === 0) ? (
            <EmptyChart message="No enrolments yet" />
          ) : (
            <MagnitudeBars
              data={categoryBreakdown.map((row) => ({ name: row.name, value: row.enrollments }))}
              name="Enrolments"
              labelWidth={130}
            />
          )}
        </ChartCard>
      </section>

      {/* Every course is free, so there is no payment state to report here. */}

      {/* ── Leaderboards ───────────────────────────────────────────────── */}
      <section className="grid gap-5 lg:grid-cols-2">
        <div className="surface-raised overflow-hidden">
          <div className="panel-heading">
            <h3 className="text-base">Top courses by enrolment</h3>
            <Link to="/admin/courses" className="btn-ghost btn-sm">
              All courses
            </Link>
          </div>

          {topCourses.length === 0 ? (
            <EmptyState icon={BookOpen} title="No published courses yet" className="py-10" />
          ) : (
            <ol className="divide-y divide-ink-800">
              {topCourses.map((course, index) => (
                <li key={course._id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                  <span className="w-5 shrink-0 text-center font-display text-sm font-bold text-slate-600">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/courses/${course.slug}`}
                      className="line-clamp-1 text-sm font-medium text-white transition-colors hover:text-violet-300"
                    >
                      {course.title}
                    </Link>
                    {/* A div, not a p: StarRating renders a div and cannot be nested in one. */}
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-2xs text-slate-500">
                      <span>{course.instructor?.name}</span>
                      {course.ratingCount > 0 && (
                        <StarRating value={course.ratingAverage} size="sm" />
                      )}
                    </div>
                  </div>
                  <Badge tone="violet" className="shrink-0">
                    {compactNumber(course.enrollmentCount)}
                  </Badge>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="surface-raised overflow-hidden">
          <div className="panel-heading">
            <h3 className="text-base">Top instructors by students</h3>
            <Link to="/admin/users?role=instructor" className="btn-ghost btn-sm">
              All instructors
            </Link>
          </div>

          {topInstructors.length === 0 ? (
            <EmptyState icon={UserCog} title="No enrolments yet" className="py-10" />
          ) : (
            <ol className="divide-y divide-ink-800">
              {topInstructors.map((row, index) => (
                <li key={row.instructor._id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                  <span className="w-5 shrink-0 text-center font-display text-sm font-bold text-slate-600">
                    {index + 1}
                  </span>
                  <Avatar src={row.instructor.avatar} name={row.instructor.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/instructors/${row.instructor._id}`}
                      className="truncate text-sm font-medium text-white transition-colors hover:text-violet-300"
                    >
                      {row.instructor.name}
                    </Link>
                    <p className="truncate text-2xs text-slate-600">{row.instructor.email}</p>
                  </div>
                  <Badge tone="cyan" className="shrink-0">
                    {compactNumber(row.students)}
                  </Badge>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      {/* ── Activity and pending queue ─────────────────────────────────── */}
      <section className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <div className="surface-raised overflow-hidden">
          <div className="panel-heading">
            <h3 className="text-base">Recent activity</h3>
          </div>

          {activity.length === 0 ? (
            <EmptyState icon={TrendingUp} title="Nothing has happened yet" className="py-10" />
          ) : (
            <ul className="max-h-[26rem] divide-y divide-ink-800 overflow-y-auto">
              {activity.map((item, index) => {
                const Icon = ACTIVITY_ICON[item.type] || TrendingUp;
                return (
                  <li key={index} className="flex items-start gap-3 px-4 py-3 sm:px-5">
                    <span
                      className={clsx(
                        'mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg',
                        ACTIVITY_TONE[item.type] || 'bg-ink-700 text-slate-400'
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      {item.link ? (
                        <Link to={item.link} className="text-sm text-slate-300 hover:text-violet-300">
                          {item.text}
                        </Link>
                      ) : (
                        <p className="text-sm text-slate-300">{item.text}</p>
                      )}
                      <p className="mt-0.5 text-2xs text-slate-600">{timeAgo(item.at)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="surface-raised overflow-hidden">
          <div className="panel-heading">
            <h3 className="text-base">Approval queue</h3>
            <Link to="/admin/approvals" className="btn-ghost btn-sm">
              Review
            </Link>
          </div>

          {pending.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="Queue is clear"
              description="No courses are waiting on a decision."
              className="py-10"
            />
          ) : (
            <ul className="divide-y divide-ink-800">
              {pending.slice(0, 6).map((course) => (
                <li key={course._id} className="px-4 py-3 sm:px-5">
                  <Link
                    to="/admin/approvals"
                    className="line-clamp-1 text-sm font-medium text-white transition-colors hover:text-violet-300"
                  >
                    {course.title}
                  </Link>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-2xs text-slate-500">
                    <span>{course.instructor?.name}</span>
                    <span aria-hidden="true">·</span>
                    <span>{course.publishedLessons} lessons</span>
                    <span aria-hidden="true">·</span>
                    <span>submitted {timeAgo(course.submittedAt)}</span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
