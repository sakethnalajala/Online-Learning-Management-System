import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  BookMarked,
  CheckCircle2,
  Clock,
  Compass,
  ListChecks,
  PlayCircle,
  Search,
  TrendingUp,
} from 'lucide-react';
import { certificateApi, progressApi, quizApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { assetUrl } from '../../api/client';
import BackButton from '../../components/layout/BackButton';
import {
  Avatar,
  Button,
  EmptyState,
  ErrorState,
  ProgressBar,
  ProgressRing,
  Skeleton,
  StatCard,
} from '../../components/ui';
import { ChartCard, EmptyChart, MagnitudeBars, Meter } from '../../components/charts';
import { compactNumber, formatDate, formatDuration, timeAgo } from '../../utils/format';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [quizzes, setQuizzes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [progress, certs, quizData] = await Promise.all([
        progressApi.overview(),
        certificateApi.mine().catch(() => []),
        quizApi.myResults().catch(() => null),
      ]);
      setOverview(progress);
      setCertificates(certs);
      setQuizzes(quizData);
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
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  if (error) return <ErrorState message={error} onRetry={load} />;

  const { continueLearning = [], summary = {}, progressByCourse = [] } = overview || {};
  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="space-y-8">
      <BackButton to="/" label="Back to site" />

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="surface-raised relative overflow-hidden p-6 sm:p-8">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-violet-600/15 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="min-w-0">
            <p className="text-sm font-medium text-violet-300">Welcome back</p>
            <h1 className="mt-1 text-2xl sm:text-3xl">{firstName}</h1>
            <p className="mt-2.5 max-w-lg text-sm leading-relaxed text-slate-400">
              {summary.enrolled === 0
                ? 'You have not enrolled in anything yet. The catalogue is a good place to start.'
                : summary.completed > 0
                  ? `You have completed ${summary.completed} course${summary.completed === 1 ? '' : 's'} and finished ${summary.lessonsCompleted} lessons in total. Keep going.`
                  : `You are working through ${summary.enrolled} course${summary.enrolled === 1 ? '' : 's'}. ${summary.lessonsCompleted} lessons done so far.`}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {continueLearning[0] ? (
                <Link to={`/learn/${continueLearning[0].course._id}`} className="btn-primary">
                  <PlayCircle className="h-4 w-4" aria-hidden="true" />
                  Continue learning
                </Link>
              ) : (
                <Link to="/courses" className="btn-primary">
                  <Compass className="h-4 w-4" aria-hidden="true" />
                  Find a course
                </Link>
              )}
              <Link to="/student/courses" className="btn-secondary">
                My courses
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <ProgressRing value={summary.averageProgress || 0} size={112} stroke={9}>
              <span className="font-display text-2xl font-bold text-white">
                {summary.averageProgress || 0}%
              </span>
              <span className="mt-0.5 text-2xs font-semibold uppercase tracking-wider text-slate-500">
                Average
              </span>
            </ProgressRing>
          </div>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Enrolled"
          value={summary.enrolled || 0}
          icon={BookMarked}
          tone="violet"
          hint={`${summary.inProgress || 0} in progress`}
        />
        <StatCard
          label="Completed"
          value={summary.completed || 0}
          icon={CheckCircle2}
          tone="emerald"
          hint={`${summary.notStarted || 0} not started`}
        />
        <StatCard
          label="Lessons done"
          value={compactNumber(summary.lessonsCompleted || 0)}
          icon={PlayCircle}
          tone="cyan"
          hint={formatDuration(summary.watchedMinutes || 0) + ' watched'}
        />
        <StatCard
          label="Certificates"
          value={certificates.length}
          icon={Award}
          tone="amber"
          hint={certificates.length ? 'Ready to share' : 'Finish a course to earn one'}
        />
      </section>

      {/* ── Continue learning ──────────────────────────────────────────── */}
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl">Continue learning</h2>
          <Link to="/student/courses" className="text-sm font-semibold text-violet-300 hover:text-violet-200">
            View all courses
          </Link>
        </div>

        {continueLearning.length === 0 ? (
          <div className="surface-raised">
            <EmptyState
              icon={Search}
              title={summary.enrolled === 0 ? 'Nothing in progress yet' : 'All caught up'}
              description={
                summary.enrolled === 0
                  ? 'Enrol in a course and it will show up here so you can pick up where you left off.'
                  : 'You have finished everything you are enrolled in. Time to find something new.'
              }
              action={
                <Link to="/courses" className="btn-primary">
                  Browse the catalogue
                </Link>
              }
            />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {continueLearning.map((item) => (
              <Link
                key={item.course._id}
                to={`/learn/${item.course._id}`}
                className="surface-interactive group flex gap-4 p-4"
              >
                <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-ink-800">
                  {assetUrl(item.course.thumbnail) ? (
                    <img
                      src={assetUrl(item.course.thumbnail)}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <span className="grid h-full place-items-center bg-gradient-to-br from-violet-900/50 to-ink-850">
                      <BookMarked className="h-5 w-5 text-violet-500/60" aria-hidden="true" />
                    </span>
                  )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                  <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white transition-colors group-hover:text-violet-300">
                    {item.course.title}
                  </h3>
                  {item.lastLesson?.title && (
                    <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                      Next: {item.lastLesson.title}
                    </p>
                  )}
                  <div className="mt-auto pt-2.5">
                    <ProgressBar value={item.percentage} size="sm" />
                    <p className="mt-1.5 flex items-center justify-between text-2xs text-slate-500">
                      <span>
                        {item.completedCount}/{item.totalLessons} lessons
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        {timeAgo(item.lastAccessedAt)}
                      </span>
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Charts and quiz summary ────────────────────────────────────── */}
      <section className="grid gap-5 lg:grid-cols-2">
        <ChartCard
          title="Progress by course"
          subtitle="How far you are through each course you are enrolled in"
          height={Math.max(220, progressByCourse.length * 42)}
          tableData={progressByCourse.map((row) => ({
            course: row.title,
            progress: `${row.percentage}%`,
          }))}
          tableColumns={[
            { key: 'course', label: 'Course' },
            { key: 'progress', label: 'Progress', align: 'right' },
          ]}
        >
          {progressByCourse.length === 0 ? (
            <EmptyChart message="Enrol in a course to see your progress here" />
          ) : (
            <MagnitudeBars
              data={progressByCourse.map((row) => ({
                name: row.title.length > 26 ? `${row.title.slice(0, 24)}…` : row.title,
                value: row.percentage,
              }))}
              name="Progress %"
              labelWidth={150}
            />
          )}
        </ChartCard>

        <div className="surface-raised p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base">Quiz performance</h3>
              <p className="mt-0.5 text-xs text-slate-500">Your best score on each quiz</p>
            </div>
            <Link to="/student/quizzes" className="btn-ghost btn-sm">
              Details
            </Link>
          </div>

          {!quizzes || quizzes.summary.quizzesTaken === 0 ? (
            <EmptyState
              icon={ListChecks}
              title="No quizzes taken yet"
              description="Quizzes appear inside lessons. Your best attempt is the one that counts."
              className="py-8"
            />
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { label: 'Taken', value: quizzes.summary.quizzesTaken },
                  { label: 'Passed', value: quizzes.summary.quizzesPassed },
                  { label: 'Avg score', value: `${quizzes.summary.averageScore}%` },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl bg-ink-800/70 p-3">
                    <p className="font-display text-xl font-bold text-white">{stat.value}</p>
                    <p className="mt-0.5 text-2xs font-semibold uppercase tracking-wider text-slate-500">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>

              <Meter
                label="Pass rate"
                value={quizzes.summary.quizzesPassed}
                total={quizzes.summary.quizzesTaken}
                tone="emerald"
                hint={`${quizzes.summary.totalAttempts} total attempt${quizzes.summary.totalAttempts === 1 ? '' : 's'} including retakes`}
              />

              <ul className="space-y-2 border-t border-ink-700/70 pt-4">
                {quizzes.bestAttempts.slice(0, 4).map((attempt) => (
                  <li key={attempt._id} className="flex items-center gap-3 text-sm">
                    <span
                      className={
                        attempt.passed
                          ? 'badge-emerald shrink-0'
                          : 'badge-rose shrink-0'
                      }
                    >
                      {attempt.score}%
                    </span>
                    <span className="min-w-0 flex-1 truncate text-slate-300">
                      {attempt.quiz?.title || attempt.lesson?.title || 'Quiz'}
                    </span>
                    <span className="shrink-0 text-2xs text-slate-600">
                      {timeAgo(attempt.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* ── Certificates ───────────────────────────────────────────────── */}
      {certificates.length > 0 && (
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl">Your certificates</h2>
            <Link
              to="/student/certificates"
              className="text-sm font-semibold text-violet-300 hover:text-violet-200"
            >
              View all
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {certificates.slice(0, 3).map((certificate) => (
              <Link
                key={certificate._id}
                to={`/student/certificates/${certificate._id}`}
                className="surface-interactive flex items-start gap-4 p-5"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-500/15 text-accent-amber">
                  <Award className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 block text-sm font-semibold text-white">
                    {certificate.courseTitle}
                  </span>
                  <span className="mt-1 block font-mono text-2xs text-violet-300">
                    {certificate.certificateId}
                  </span>
                  <span className="mt-1 block text-2xs text-slate-500">
                    Issued {formatDate(certificate.issuedAt)}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
