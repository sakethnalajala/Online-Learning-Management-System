import { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  Clock,
  HelpCircle,
  RotateCcw,
  Send,
  Trophy,
  XCircle,
} from 'lucide-react';
import { quizApi } from '../../api/endpoints';
import {
  Button,
  EmptyState,
  InlineAlert,
  PageLoader,
  ProgressBar,
  Spinner,
} from '../ui';

const mmss = (seconds) => {
  const safe = Math.max(0, seconds);
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
};

/**
 * Takes a lesson quiz. Answers are collected locally and graded by the server —
 * correct options are never sent to the browser before submission, so the score
 * cannot be manipulated from here.
 */
export default function QuizRunner({ lessonId, onPassed, onClose }) {
  const [state, setState] = useState({ loading: true, quiz: null, error: '' });
  const [answers, setAnswers] = useState({});
  const [index, setIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [remaining, setRemaining] = useState(null);
  const startedAt = useRef(Date.now());

  const load = async () => {
    setState({ loading: true, quiz: null, error: '' });
    setResult(null);
    setAnswers({});
    setIndex(0);
    setElapsed(0);
    startedAt.current = Date.now();

    try {
      const data = await quizApi.getByLesson(lessonId);
      setState({ loading: false, quiz: data, error: '' });
      if (data.quiz.timeLimitMinutes > 0) setRemaining(data.quiz.timeLimitMinutes * 60);
    } catch (err) {
      setState({ loading: false, quiz: null, error: err.message });
    }
  };

  useEffect(() => {
    load();
  }, [lessonId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Elapsed-time ticker, and the countdown when the quiz is timed.
  useEffect(() => {
    if (result || state.loading || !state.quiz) return undefined;

    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
      if (remaining != null) {
        setRemaining((value) => {
          if (value <= 1) {
            clearInterval(timer);
            return 0;
          }
          return value - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [result, state.loading, state.quiz, remaining != null]); // eslint-disable-line react-hooks/exhaustive-deps

  const quiz = state.quiz?.quiz;
  const questions = quiz?.questions || [];
  const answeredCount = Object.values(answers).filter((list) => list?.length > 0).length;

  const submit = async () => {
    if (answeredCount === 0) {
      toast.error('Answer at least one question before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        answers: questions
          .filter((question) => answers[question._id]?.length > 0)
          .map((question) => ({
            questionId: question._id,
            selectedOptionIds: answers[question._id],
          })),
        timeSpentSeconds: elapsed,
      };

      const data = await quizApi.submit(quiz._id, payload);
      setResult(data);

      if (data.passed) {
        toast.success(`Passed with ${data.score}%.`);
        // A passed required quiz may have completed the lesson, and with it the
        // course, so let the parent refresh progress.
        onPassed?.(data);
      } else {
        toast.error(`Scored ${data.score}%. The pass mark is ${data.passingScore}%.`);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Auto-submit when a timed quiz runs out.
  useEffect(() => {
    if (remaining === 0 && !result && !submitting && questions.length > 0) {
      toast.error('Time is up — submitting your answers.');
      submit();
    }
  }, [remaining]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleOption = (question, optionId) => {
    setAnswers((current) => {
      const existing = current[question._id] || [];
      if (question.type === 'multiple') {
        return {
          ...current,
          [question._id]: existing.includes(optionId)
            ? existing.filter((id) => id !== optionId)
            : [...existing, optionId],
        };
      }
      return { ...current, [question._id]: [optionId] };
    });
  };

  if (state.loading) return <PageLoader label="Loading quiz" />;

  if (state.error) {
    return (
      <div className="surface p-6">
        <InlineAlert tone="rose" icon={AlertCircle} title="Quiz unavailable">
          {state.error}
        </InlineAlert>
        <Button variant="secondary" onClick={onClose} className="mt-4">
          Back to the lesson
        </Button>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="surface">
        <EmptyState
          icon={HelpCircle}
          title="This quiz has no questions yet"
          description="The instructor created the quiz but has not added questions."
          action={
            <Button variant="secondary" onClick={onClose}>
              Back to the lesson
            </Button>
          }
        />
      </div>
    );
  }

  /* ── Results view ──────────────────────────────────────────────────────── */

  if (result) {
    return (
      <div className="space-y-5">
        <div
          className={clsx(
            'surface-raised overflow-hidden text-center',
            result.passed ? 'ring-1 ring-emerald-500/25' : 'ring-1 ring-rose-500/25'
          )}
        >
          <div
            className={clsx(
              'px-6 py-8',
              result.passed
                ? 'bg-gradient-to-b from-emerald-500/12 to-transparent'
                : 'bg-gradient-to-b from-rose-500/12 to-transparent'
            )}
          >
            <span
              className={clsx(
                'mb-4 inline-grid h-16 w-16 place-items-center rounded-2xl',
                result.passed ? 'bg-emerald-500/20 text-accent-emerald' : 'bg-rose-500/20 text-accent-rose'
              )}
            >
              {result.passed ? (
                <Trophy className="h-8 w-8" aria-hidden="true" />
              ) : (
                <RotateCcw className="h-8 w-8" aria-hidden="true" />
              )}
            </span>

            <p
              className={clsx(
                'font-display text-5xl font-extrabold',
                result.passed ? 'text-accent-emerald' : 'text-accent-rose'
              )}
            >
              {result.score}%
            </p>
            <h3 className="mt-3 text-xl">
              {result.passed ? 'You passed' : 'Not quite yet'}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-400">
              You answered {result.correctCount} of {result.questionCount} correctly
              {' '}({result.pointsEarned}/{result.totalPoints} points). The pass mark is{' '}
              {result.passingScore}%.
            </p>

            {result.completion?.justCompletedCourse && (
              <div className="mx-auto mt-5 max-w-md">
                <InlineAlert tone="emerald" icon={Award} title="Course complete">
                  That was the last thing you needed. Your certificate
                  {result.completion.certificateId ? ` (${result.completion.certificateId})` : ''} is
                  ready on your dashboard.
                </InlineAlert>
              </div>
            )}

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button variant="secondary" icon={RotateCcw} onClick={load}>
                Retake quiz
              </Button>
              <Button onClick={onClose} icon={ArrowRight}>
                Back to the lesson
              </Button>
            </div>
          </div>
        </div>

        {result.review?.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg">Review your answers</h3>
            {result.review.map((item, itemIndex) => (
              <div
                key={item.questionId}
                className={clsx(
                  'surface p-5',
                  item.isCorrect ? 'ring-1 ring-emerald-500/20' : 'ring-1 ring-rose-500/20'
                )}
              >
                <div className="flex items-start gap-3">
                  {item.isCorrect ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent-emerald" aria-hidden="true" />
                  ) : (
                    <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-accent-rose" aria-hidden="true" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">
                      {itemIndex + 1}. {item.text}
                    </p>

                    <ul className="mt-3 space-y-1.5">
                      {item.options.map((option) => {
                        const chosen = item.selectedOptionIds.includes(String(option._id));
                        return (
                          <li
                            key={option._id}
                            className={clsx(
                              'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm',
                              option.isCorrect
                                ? 'bg-emerald-500/12 text-emerald-200 ring-1 ring-inset ring-emerald-500/25'
                                : chosen
                                  ? 'bg-rose-500/12 text-rose-200 ring-1 ring-inset ring-rose-500/25'
                                  : 'text-slate-400'
                            )}
                          >
                            <span className="min-w-0 flex-1">{option.text}</span>
                            {option.isCorrect && (
                              <span className="shrink-0 text-2xs font-bold uppercase">Correct</span>
                            )}
                            {chosen && !option.isCorrect && (
                              <span className="shrink-0 text-2xs font-bold uppercase">Your answer</span>
                            )}
                          </li>
                        );
                      })}
                    </ul>

                    {item.explanation && (
                      <p className="mt-3 rounded-lg border-l-2 border-violet-500 bg-violet-500/[0.07] px-3 py-2 text-xs leading-relaxed text-slate-300">
                        {item.explanation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ── Attempt view ──────────────────────────────────────────────────────── */

  const question = questions[index];
  const selected = answers[question._id] || [];
  const isLast = index === questions.length - 1;
  const { attemptsUsed, attemptsRemaining, bestScore } = state.quiz;

  return (
    <div className="space-y-5">
      <div className="surface-raised p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-xl">{quiz.title}</h2>
            {quiz.description && <p className="mt-1 text-sm text-slate-400">{quiz.description}</p>}
            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
              <span>{questions.length} questions</span>
              <span>Pass mark {quiz.passingScore}%</span>
              <span>{quiz.totalPoints} points</span>
              {attemptsRemaining != null && <span>{attemptsRemaining} attempt(s) left</span>}
              {bestScore != null && (
                <span className="font-semibold text-violet-300">Best so far {bestScore}%</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Clock
              className={clsx('h-4 w-4', remaining != null && remaining < 60 ? 'text-accent-rose' : 'text-slate-500')}
              aria-hidden="true"
            />
            <span
              className={clsx(
                'font-mono font-bold tabular-nums',
                remaining != null && remaining < 60 ? 'text-accent-rose' : 'text-slate-300'
              )}
            >
              {remaining != null ? mmss(remaining) : mmss(elapsed)}
            </span>
          </div>
        </div>

        {quiz.isRequiredForCompletion && (
          <InlineAlert tone="amber" icon={AlertCircle} className="mt-4">
            You need {quiz.passingScore}% or higher on this quiz before the lesson counts as complete.
          </InlineAlert>
        )}

        <div className="mt-4">
          <ProgressBar
            value={(answeredCount / questions.length) * 100}
            size="sm"
            label={`${answeredCount} of ${questions.length} answered`}
            showLabel
          />
        </div>
      </div>

      <div className="surface-raised p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="badge-violet">
            Question {index + 1} of {questions.length}
          </span>
          <span className="text-xs text-slate-500">
            {question.points} point{question.points === 1 ? '' : 's'}
            {question.type === 'multiple' && ' · select all that apply'}
          </span>
        </div>

        <p className="text-base font-semibold leading-relaxed text-white sm:text-lg">{question.text}</p>

        <div className="mt-5 space-y-2.5">
          {question.options.map((option, optionIndex) => {
            const chosen = selected.includes(option._id);
            return (
              <label
                key={option._id}
                className={clsx(
                  'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all duration-200',
                  chosen
                    ? 'border-violet-500 bg-violet-600/12 ring-2 ring-violet-500/25'
                    : 'border-ink-600 bg-ink-800/50 hover:border-ink-500 hover:bg-ink-800'
                )}
              >
                <input
                  type={question.type === 'multiple' ? 'checkbox' : 'radio'}
                  name={question._id}
                  checked={chosen}
                  onChange={() => toggleOption(question, option._id)}
                  className="sr-only"
                />
                <span
                  className={clsx(
                    'mt-0.5 grid h-5 w-5 shrink-0 place-items-center text-2xs font-bold',
                    question.type === 'multiple' ? 'rounded-md' : 'rounded-full',
                    chosen ? 'bg-violet-600 text-white' : 'bg-ink-700 text-slate-500'
                  )}
                >
                  {chosen ? '✓' : String.fromCharCode(65 + optionIndex)}
                </span>
                <span className={clsx('text-sm leading-relaxed', chosen ? 'text-white' : 'text-slate-300')}>
                  {option.text}
                </span>
              </label>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-ink-700/70 pt-5">
          <Button
            variant="secondary"
            icon={ArrowLeft}
            onClick={() => setIndex((value) => Math.max(0, value - 1))}
            disabled={index === 0}
          >
            Previous
          </Button>

          <div className="flex flex-wrap gap-1.5">
            {questions.map((item, itemIndex) => (
              <button
                key={item._id}
                type="button"
                onClick={() => setIndex(itemIndex)}
                aria-label={`Go to question ${itemIndex + 1}`}
                aria-current={itemIndex === index}
                className={clsx(
                  'h-7 w-7 rounded-lg text-xs font-bold transition-colors',
                  itemIndex === index
                    ? 'bg-violet-600 text-white'
                    : answers[item._id]?.length
                      ? 'bg-violet-500/25 text-violet-200'
                      : 'bg-ink-700 text-slate-500 hover:bg-ink-600'
                )}
              >
                {itemIndex + 1}
              </button>
            ))}
          </div>

          {isLast ? (
            <Button icon={Send} onClick={submit} loading={submitting}>
              Submit quiz
            </Button>
          ) : (
            <Button iconRight={ArrowRight} onClick={() => setIndex((value) => value + 1)}>
              Next
            </Button>
          )}
        </div>
      </div>

      {answeredCount < questions.length && (
        <p className="text-center text-xs text-slate-500">
          {questions.length - answeredCount} question
          {questions.length - answeredCount === 1 ? '' : 's'} still unanswered. Unanswered questions
          score zero.
        </p>
      )}
    </div>
  );
}
