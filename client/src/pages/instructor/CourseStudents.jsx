import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import clsx from 'clsx';
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Eye,
  GraduationCap,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react';
import { courseApi, progressApi } from '../../api/endpoints';
import {
  Avatar,
  Badge,
  EmptyState,
  ErrorState,
  Modal,
  Pagination,
  ProgressBar,
  Skeleton,
  StatCard,
  Tabs,
  TableSkeleton,
} from '../../components/ui';
import { PageHeader } from '../../components/layout/BackButton';
import {
  ChartCard,
  EmptyChart,
  MagnitudeColumns,
  Meter,
  TrendArea,
} from '../../components/charts';
import { formatDate, formatDateTime, timeAgo } from '../../utils/format';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'In progress' },
  { id: 'completed', label: 'Completed' },
];

export default function CourseStudents() {
  const { id } = useParams();

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [tab, setTab] = useState('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [studentsRes, analyticsData] = await Promise.all([
        courseApi.students(id, { page, limit: 20, ...(tab !== 'all' ? { status: tab } : {}) }),
        courseApi.analytics(id),
      ]);
      setRows(studentsRes.data);
      setMeta(studentsRes.meta);
      setAnalytics(analyticsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id, page, tab]);

  useEffect(() => {
    load();
  }, [load]);

  const openStudent = async (row) => {
    setDetail({ student: row.student, loading: true });
    setDetailLoading(true);
    try {
      const data = await progressApi.studentProgress(row.student._id, id);
      setDetail({ student: row.student, ...data });
    } catch (err) {
      setDetail({ student: row.student, error: err.message });
    } finally {
      setDetailLoading(false);
    }
  };

  if (error) {
    return (
      <div className="py-10">
        <ErrorState message={error} onRetry={load} />
        <div className="mt-6 text-center">
          <Link to="/instructor/courses" className="btn-secondary">
            Back to my courses
          </Link>
        </div>
      </div>
    );
  }

  const course = analytics?.course;

  return (
    <div className="space-y-7">
      <div>
        <PageHeader
        backTo={`/instructor/courses/${id}`}
        backLabel="Back to the course"
          eyebrow="Student monitoring"
          title={course?.title || 'Enrolled students'}
          description="Who has enrolled, how far they have got, and where they stopped."
        />
      </div>

      {loading && !analytics ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : (
        analytics && (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard
                label="Enrolled students"
                value={analytics.course.enrollmentCount}
                icon={Users}
                tone="violet"
              />
              <StatCard
                label="Completions"
                value={analytics.completions}
                icon={CheckCircle2}
                tone="emerald"
                hint={
                  analytics.course.enrollmentCount > 0
                    ? `${Math.round((analytics.completions / analytics.course.enrollmentCount) * 100)}% of students`
                    : undefined
                }
              />
              <StatCard
                label="Average progress"
                value={`${analytics.averageProgress}%`}
                icon={TrendingUp}
                tone="cyan"
              />
              <StatCard
                label="Rating"
                value={analytics.course.ratingAverage || '—'}
                icon={Star}
                tone="amber"
                hint={`${analytics.course.ratingCount} review${analytics.course.ratingCount === 1 ? '' : 's'}`}
              />
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <ChartCard
                title="Enrolments over the last 30 days"
                subtitle="New students joining this course"
                tableData={analytics.enrollmentTrend
                  .filter((row) => row.count > 0)
                  .map((row) => ({ date: formatDate(row.date), count: row.count }))}
                tableColumns={[
                  { key: 'date', label: 'Date' },
                  { key: 'count', label: 'Enrolments', align: 'right' },
                ]}
              >
                {analytics.enrollmentTrend.every((row) => row.count === 0) ? (
                  <EmptyChart message="No enrolments in the last 30 days" />
                ) : (
                  <TrendArea data={analytics.enrollmentTrend} name="Enrolments" />
                )}
              </ChartCard>

              <ChartCard
                title="How far students get"
                subtitle="Number of students in each progress band — the drop-off is where to look"
                tableData={analytics.completionBuckets.map((row) => ({
                  band: row.label,
                  students: row.count,
                }))}
                tableColumns={[
                  { key: 'band', label: 'Progress band' },
                  { key: 'students', label: 'Students', align: 'right' },
                ]}
              >
                {analytics.completionBuckets.every((row) => row.count === 0) ? (
                  <EmptyChart message="No progress data yet" />
                ) : (
                  <MagnitudeColumns data={analytics.completionBuckets} name="Students" />
                )}
              </ChartCard>
            </div>

            {analytics.course.ratingCount > 0 && (
              <div className="surface-raised p-5">
                <h3 className="mb-4 text-base">Rating breakdown</h3>
                <div className="grid gap-3 sm:grid-cols-5">
                  {analytics.ratingBreakdown.map((row) => (
                    <Meter
                      key={row.stars}
                      label={`${row.stars} star${row.stars === 1 ? '' : 's'}`}
                      value={row.count}
                      total={analytics.course.ratingCount}
                      tone="amber"
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )
      )}

      {/* ── Student table ──────────────────────────────────────────────── */}
      <div className="surface-raised overflow-hidden">
        <div className="px-4 pt-4 sm:px-5">
          <Tabs
            tabs={TABS.map((item) => ({
              ...item,
              count: item.id === 'all' ? meta?.total : undefined,
            }))}
            active={tab}
            onChange={(next) => {
              setTab(next);
              setPage(1);
            }}
          />
        </div>

        {loading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title={tab === 'completed' ? 'No completions yet' : 'No students enrolled yet'}
            description={
              tab === 'completed'
                ? 'Nobody has finished every lesson in this course so far.'
                : 'Once the course is published and students enrol, they will appear here with live progress.'
            }
          />
        ) : (
          <>
            <div className="table-wrap px-4 pb-4 sm:px-5">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Progress</th>
                    <th className="text-center">Lessons</th>
                    <th>Enrolled</th>
                    <th>Last active</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.enrollmentId}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <Avatar src={row.student?.avatar} name={row.student?.name} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-white">{row.student?.name}</p>
                            <p className="truncate text-2xs text-slate-600">{row.student?.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="min-w-[10rem]">
                        <ProgressBar value={row.percentage} size="sm" />
                        <p className="mt-1 flex items-center gap-2 text-2xs">
                          <span
                            className={clsx(
                              'font-bold',
                              row.isCompleted ? 'text-accent-emerald' : 'text-violet-300'
                            )}
                          >
                            {row.percentage}%
                          </span>
                          {row.isCompleted && <Badge tone="emerald">Completed</Badge>}
                          {row.paymentStatus === 'pending_payment' && (
                            <Badge tone="amber">Payment pending</Badge>
                          )}
                        </p>
                      </td>

                      <td className="text-center tabular-nums text-slate-400">
                        {row.completedLessons}/{row.totalLessons}
                      </td>

                      <td className="whitespace-nowrap text-slate-400">{formatDate(row.enrolledAt)}</td>

                      <td className="whitespace-nowrap text-slate-400">{timeAgo(row.lastAccessedAt)}</td>

                      <td className="text-right">
                        <button
                          type="button"
                          onClick={() => openStudent(row)}
                          className="btn-secondary btn-sm"
                        >
                          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-ink-700/70 p-4 sm:p-5">
              <Pagination meta={meta} onChange={setPage} />
            </div>
          </>
        )}
      </div>

      {/* ── Student drill-down ─────────────────────────────────────────── */}
      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail?.student?.name || 'Student progress'}
        description={detail?.student?.email}
        size="lg"
      >
        {detailLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : detail?.error ? (
          <ErrorState message={detail.error} />
        ) : detail?.progress ? (
          <div className="space-y-6">
            <div>
              <ProgressBar
                value={detail.progress.percentage}
                size="lg"
                showLabel
                label="Course progress"
              />
              <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                {[
                  { label: 'Completed', value: detail.progress.completedLessons?.length || 0 },
                  { label: 'Total lessons', value: detail.progress.totalLessons },
                  { label: 'Watched', value: `${detail.progress.totalWatchedMinutes || 0}m` },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl bg-ink-800/70 p-3">
                    <p className="font-display text-lg font-bold text-white">{stat.value}</p>
                    <p className="mt-0.5 text-2xs font-semibold uppercase tracking-wider text-slate-500">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {detail.progress.completedLessons?.length > 0 && (
              <section>
                <h4 className="mb-2.5 text-sm font-bold text-white">Lessons completed</h4>
                <ul className="max-h-48 space-y-1.5 overflow-y-auto">
                  {detail.progress.completedLessons.map((entry) => (
                    <li
                      key={String(entry.lesson?._id || entry.lesson)}
                      className="flex items-center gap-2.5 rounded-lg bg-ink-800/50 px-3 py-2 text-xs"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-accent-emerald" aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate text-slate-300">
                        {entry.lesson?.title || 'Lesson'}
                      </span>
                      <span className="shrink-0 text-slate-600">{timeAgo(entry.completedAt)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section>
              <h4 className="mb-2.5 text-sm font-bold text-white">
                Quiz attempts ({detail.quizAttempts?.length || 0})
              </h4>
              {!detail.quizAttempts?.length ? (
                <p className="rounded-xl border border-dashed border-ink-600 px-4 py-5 text-center text-xs text-slate-500">
                  No quiz attempts yet.
                </p>
              ) : (
                <ul className="space-y-2">
                  {detail.quizAttempts.map((attempt) => (
                    <li
                      key={attempt._id}
                      className="flex flex-wrap items-center gap-2.5 rounded-xl border border-ink-700 bg-ink-850/70 p-3 text-xs"
                    >
                      <span className={attempt.passed ? 'badge-emerald' : 'badge-rose'}>
                        {attempt.score}%
                      </span>
                      <span className="min-w-0 flex-1 truncate text-slate-300">
                        {attempt.quiz?.title || attempt.lesson?.title || 'Quiz'}
                      </span>
                      <span className="shrink-0 text-slate-600">
                        Attempt {attempt.attemptNumber} · {formatDateTime(attempt.submittedAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {detail.progress.lastLesson && (
              <p className="rounded-xl border border-ink-700 bg-ink-800/50 p-3 text-xs text-slate-400">
                Last active on{' '}
                <span className="font-semibold text-white">{detail.progress.lastLesson.title}</span>
                {' — '}
                {timeAgo(detail.progress.lastAccessedAt)}
              </p>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
