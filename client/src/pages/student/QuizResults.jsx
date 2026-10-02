import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { CheckCircle2, ListChecks, Target, TrendingUp, XCircle } from 'lucide-react';
import { quizApi } from '../../api/endpoints';
import {
  EmptyState,
  ErrorState,
  Skeleton,
  StatCard,
  Tabs,
} from '../../components/ui';
import { PageHeader } from '../../components/layout/BackButton';
import { ChartCard, EmptyChart, MagnitudeBars, Meter } from '../../components/charts';
import { formatDateTime, timeAgo } from '../../utils/format';

const TABS = [
  { id: 'best', label: 'Best per quiz' },
  { id: 'all', label: 'Every attempt' },
];

export default function QuizResults() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('best');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setData(await quizApi.myResults());
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

  const { attempts = [], bestAttempts = [], summary = {} } = data || {};
  const rows = tab === 'best' ? bestAttempts : attempts;

  return (
    <div className="space-y-7">
      <PageHeader
        backTo="/student"
        title="Quiz results"
        description="Every quiz you have attempted. Your best score on each one is what counts toward a course."
      />

      {summary.totalAttempts === 0 ? (
        <div className="surface-raised">
          <EmptyState
            icon={ListChecks}
            title="No quiz attempts yet"
            description="Quizzes live inside lessons. Open a lesson with a quiz badge and take it — retakes are unlimited unless the instructor capped them."
            action={
              <Link to="/student/courses" className="btn-primary">
                Go to my courses
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Quizzes taken" value={summary.quizzesTaken} icon={ListChecks} tone="violet" />
            <StatCard
              label="Passed"
              value={summary.quizzesPassed}
              icon={CheckCircle2}
              tone="emerald"
              hint={`${summary.quizzesTaken - summary.quizzesPassed} not yet passed`}
            />
            <StatCard label="Average score" value={`${summary.averageScore}%`} icon={Target} tone="cyan" />
            <StatCard
              label="Total attempts"
              value={summary.totalAttempts}
              icon={TrendingUp}
              tone="amber"
              hint="Including retakes"
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
            <ChartCard
              title="Best score per quiz"
              subtitle="Highest score you have achieved on each quiz"
              height={Math.max(220, bestAttempts.length * 40)}
              tableData={bestAttempts.map((attempt) => ({
                quiz: attempt.quiz?.title || 'Quiz',
                course: attempt.course?.title || '—',
                score: `${attempt.score}%`,
              }))}
              tableColumns={[
                { key: 'quiz', label: 'Quiz' },
                { key: 'course', label: 'Course' },
                { key: 'score', label: 'Best score', align: 'right' },
              ]}
            >
              {bestAttempts.length === 0 ? (
                <EmptyChart />
              ) : (
                <MagnitudeBars
                  data={bestAttempts.map((attempt) => ({
                    name:
                      (attempt.quiz?.title || 'Quiz').length > 24
                        ? `${(attempt.quiz?.title || 'Quiz').slice(0, 22)}…`
                        : attempt.quiz?.title || 'Quiz',
                    value: attempt.score,
                  }))}
                  name="Score %"
                  labelWidth={150}
                />
              )}
            </ChartCard>

            <div className="surface-raised space-y-6 p-5">
              <h3 className="text-base">Summary</h3>
              <Meter
                label="Quizzes passed"
                value={summary.quizzesPassed}
                total={summary.quizzesTaken}
                tone="emerald"
              />
              <Meter
                label="Average score"
                value={summary.averageScore}
                total={100}
                tone="violet"
                hint="Averaged over your best attempt on each quiz"
              />
              <div className="rounded-xl border border-ink-700 bg-ink-800/50 p-4">
                <p className="text-xs leading-relaxed text-slate-400">
                  Scores are calculated on the server from the correct answers stored with each
                  question. A question counts only when your selection matches exactly, so
                  multi-answer questions award no partial credit.
                </p>
              </div>
            </div>
          </div>

          <div className="surface-raised overflow-hidden">
            <div className="px-4 pt-4 sm:px-5">
              <Tabs
                tabs={TABS.map((item) => ({
                  ...item,
                  count: item.id === 'best' ? bestAttempts.length : attempts.length,
                }))}
                active={tab}
                onChange={setTab}
              />
            </div>

            <div className="table-wrap px-4 pb-4 sm:px-5">
              <table className="table">
                <thead>
                  <tr>
                    <th>Quiz</th>
                    <th>Course</th>
                    <th>Lesson</th>
                    <th className="text-center">Score</th>
                    <th className="text-center">Result</th>
                    <th>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((attempt) => (
                    <tr key={attempt._id}>
                      <td>
                        <p className="font-medium text-white">{attempt.quiz?.title || 'Quiz'}</p>
                        {tab === 'all' && (
                          <p className="text-2xs text-slate-600">Attempt {attempt.attemptNumber}</p>
                        )}
                      </td>
                      <td>
                        {attempt.course ? (
                          <Link
                            to={`/learn/${attempt.course._id}`}
                            className="text-violet-300 hover:text-violet-200"
                          >
                            {attempt.course.title}
                          </Link>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="text-slate-400">{attempt.lesson?.title || '—'}</td>
                      <td className="text-center">
                        <span
                          className={clsx(
                            'font-display font-bold',
                            attempt.passed ? 'text-accent-emerald' : 'text-accent-rose'
                          )}
                        >
                          {attempt.score}%
                        </span>
                        <p className="text-2xs text-slate-600">
                          {attempt.correctCount}/{attempt.questionCount} correct
                        </p>
                      </td>
                      <td className="text-center">
                        {attempt.passed ? (
                          <span className="badge-emerald">
                            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                            Passed
                          </span>
                        ) : (
                          <span className="badge-rose">
                            <XCircle className="h-3 w-3" aria-hidden="true" />
                            Failed
                          </span>
                        )}
                      </td>
                      <td>
                        <p className="text-slate-400">{timeAgo(attempt.submittedAt)}</p>
                        <p className="text-2xs text-slate-600">{formatDateTime(attempt.submittedAt)}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
