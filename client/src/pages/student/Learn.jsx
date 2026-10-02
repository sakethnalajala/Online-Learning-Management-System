import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import {
  Award,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock,
  FileText,
  HelpCircle,
  ListChecks,
  Menu,
  PanelLeftClose,
  PlayCircle,
  RotateCcw,
  Trophy,
  X,
} from 'lucide-react';
import { lessonApi, progressApi } from '../../api/endpoints';
import { assetUrl } from '../../api/client';
import BackButton from '../../components/layout/BackButton';
import ThemeToggle from '../../components/layout/ThemeToggle';
import ResourceList from '../../components/learn/ResourceList';
import QuizRunner from '../../components/learn/QuizRunner';
import {
  Avatar,
  Badge,
  Button,
  ErrorState,
  InlineAlert,
  PageLoader,
  ProgressBar,
  Spinner,
} from '../../components/ui';
import { formatDuration, youtubeEmbed } from '../../utils/format';

/** Video player for the active lesson: YouTube embed, uploaded file, or nothing. */
function LessonPlayer({ lesson }) {
  const embed = youtubeEmbed(lesson.videoUrl);

  if (embed) {
    return (
      <div className="aspect-video w-full overflow-hidden bg-black">
        <iframe
          key={lesson._id}
          src={embed}
          title={lesson.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    );
  }

  if (lesson.videoUrl) {
    return (
      <div className="aspect-video w-full bg-black">
        <video key={lesson._id} src={assetUrl(lesson.videoUrl)} controls className="h-full w-full">
          <track kind="captions" />
          Your browser does not support embedded video.
        </video>
      </div>
    );
  }

  // Article-style lesson: a calm banner instead of a broken player.
  return (
    <div className="flex aspect-[21/7] w-full items-center justify-center bg-gradient-to-br from-violet-900/30 via-ink-850 to-ink-900">
      <div className="text-center">
        <FileText className="mx-auto h-8 w-8 text-violet-400/70" aria-hidden="true" />
        <p className="mt-2 text-sm font-medium text-slate-400">Reading lesson</p>
      </div>
    </div>
  );
}

export default function Learn() {
  const { courseId } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeId, setActiveId] = useState(params.get('lesson') || null);
  const [lesson, setLesson] = useState(null);
  const [lessonLoading, setLessonLoading] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expanded, setExpanded] = useState(() => new Set());
  const [marking, setMarking] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [justFinished, setJustFinished] = useState(null);

  const contentRef = useRef(null);

  /* ── Load course progress and curriculum ──────────────────────────────── */

  const loadCourse = useCallback(
    async (keepActive = true) => {
      try {
        const payload = await progressApi.forCourse(courseId);
        setData(payload);

        const flat = payload.curriculum.flatMap((module) => module.lessons);
        const target =
          (keepActive && activeId && flat.find((l) => String(l._id) === String(activeId))?._id) ||
          payload.resume.lessonId ||
          flat[0]?._id;

        if (target) {
          setActiveId(String(target));
          // Open the module that contains the active lesson.
          const owner = payload.curriculum.find((module) =>
            module.lessons.some((l) => String(l._id) === String(target))
          );
          if (owner) setExpanded((current) => new Set([...current, owner._id]));
        }

        return payload;
      } catch (err) {
        setError(err.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [courseId, activeId]
  );

  useEffect(() => {
    setLoading(true);
    setError('');
    loadCourse(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  /* ── Load the active lesson ───────────────────────────────────────────── */

  useEffect(() => {
    if (!activeId) return;

    let alive = true;
    setLessonLoading(true);
    setShowQuiz(false);

    lessonApi
      .get(activeId)
      .then((payload) => {
        if (!alive) return;
        setLesson(payload);
        setParams({ lesson: activeId }, { replace: true });
        contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      })
      .catch((err) => {
        if (alive) toast.error(err.message);
      })
      .finally(() => {
        if (alive) setLessonLoading(false);
      });

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  /* ── Derived navigation ──────────────────────────────────────────────── */

  const flatLessons = useMemo(
    () => data?.curriculum.flatMap((module) => module.lessons) || [],
    [data]
  );
  const currentIndex = flatLessons.findIndex((l) => String(l._id) === String(activeId));
  const previous = currentIndex > 0 ? flatLessons[currentIndex - 1] : null;
  const next = currentIndex >= 0 && currentIndex < flatLessons.length - 1 ? flatLessons[currentIndex + 1] : null;

  const currentMeta = flatLessons[currentIndex];
  const isDone = Boolean(currentMeta?.isCompleted);

  /* ── Actions ─────────────────────────────────────────────────────────── */

  const toggleComplete = async () => {
    if (!currentMeta) return;

    setMarking(true);
    try {
      if (isDone) {
        await progressApi.uncompleteLesson(currentMeta._id);
        toast.success('Marked as not complete.');
        await loadCourse(true);
      } else {
        const result = await progressApi.completeLesson(currentMeta._id, (currentMeta.durationMinutes || 0) * 60);
        await loadCourse(true);

        if (result.justCompletedCourse) {
          setJustFinished(result);
          toast.success('Course complete! Your certificate is ready.', { duration: 6000 });
        } else {
          toast.success('Lesson complete.');
          // Move along automatically — that is what the student wants next.
          if (next) setActiveId(String(next._id));
        }
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setMarking(false);
    }
  };

  const onQuizPassed = async (result) => {
    await loadCourse(true);
    if (result.completion?.justCompletedCourse) setJustFinished(result.completion);
  };

  const toggleModule = (id) =>
    setExpanded((current) => {
      const nextSet = new Set(current);
      if (nextSet.has(id)) nextSet.delete(id);
      else nextSet.add(id);
      return nextSet;
    });

  /* ── Render ──────────────────────────────────────────────────────────── */

  if (loading) return <PageLoader label="Loading your course" />;

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <ErrorState message={error} onRetry={() => loadCourse(true)} />
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/student/courses" className="btn-secondary">
            My courses
          </Link>
          <Link to={`/courses/${courseId}`} className="btn-primary">
            Course page
          </Link>
        </div>
      </div>
    );
  }

  const { course, curriculum, progress, moduleProgress } = data;
  const moduleProgressById = new Map(moduleProgress.map((row) => [String(row.moduleId), row]));

  const sidebar = (
    <>
      <div className="border-b border-ink-700 p-4">
        <BackButton
          to={`/courses/${course.slug || course._id}`}
          label="Back"
          subtle
          className="mb-3 text-xs"
        />

        <h2 className="line-clamp-2 text-sm font-bold leading-snug text-white">{course.title}</h2>

        {course.instructor && (
          <div className="mt-2.5 flex items-center gap-2">
            <Avatar src={course.instructor.avatar} name={course.instructor.name} size="xs" />
            <span className="truncate text-xs text-slate-500">{course.instructor.name}</span>
          </div>
        )}

        <div className="mt-4">
          <ProgressBar value={progress.percentage} size="md" showLabel label="Course progress" />
          <p className="mt-2 flex items-center justify-between text-2xs text-slate-500">
            <span>
              {progress.completedCount} of {progress.totalLessons} lessons
            </span>
            <span>{progress.remainingCount} to go</span>
          </p>
        </div>

        {progress.isCompleted && (
          <Link to="/student/certificates" className="btn-success btn-sm mt-3 w-full">
            <Award className="h-3.5 w-3.5" aria-hidden="true" />
            View certificate
          </Link>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-2" aria-label="Course curriculum">
        {curriculum.map((module, moduleIndex) => {
          const open = expanded.has(module._id);
          const stats = moduleProgressById.get(String(module._id));

          return (
            <div key={module._id} className="mb-1.5">
              <button
                type="button"
                onClick={() => toggleModule(module._id)}
                aria-expanded={open}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-ink-800"
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-violet-500/15 text-2xs font-bold text-violet-300">
                  {moduleIndex + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold text-white">{module.title}</span>
                  <span className="mt-0.5 block text-2xs text-slate-500">
                    {stats ? `${stats.completed}/${stats.total}` : module.lessons.length} lessons
                    {stats?.percentage === 100 && ' · done'}
                  </span>
                </span>
                <ChevronDown
                  className={clsx('h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform', open && 'rotate-180')}
                  aria-hidden="true"
                />
              </button>

              {open && (
                <ul className="ml-3 mt-0.5 space-y-0.5 border-l border-ink-700 pl-2">
                  {module.lessons.map((item) => {
                    const active = String(item._id) === String(activeId);
                    return (
                      <li key={item._id}>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveId(String(item._id));
                            setSidebarOpen(false);
                          }}
                          aria-current={active ? 'true' : undefined}
                          className={clsx(
                            'flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors',
                            active
                              ? 'bg-violet-600/20 ring-1 ring-inset ring-violet-500/30'
                              : 'hover:bg-ink-800'
                          )}
                        >
                          {item.isCompleted ? (
                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-emerald" aria-hidden="true" />
                          ) : active ? (
                            <PlayCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-300" aria-hidden="true" />
                          ) : (
                            <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-500" aria-hidden="true" />
                          )}

                          <span className="min-w-0 flex-1">
                            <span
                              className={clsx(
                                'block text-xs leading-snug',
                                active ? 'font-semibold text-white' : item.isCompleted ? 'text-slate-500' : 'text-slate-300'
                              )}
                            >
                              {item.title}
                            </span>
                            <span className="mt-0.5 flex items-center gap-2 text-2xs text-slate-600">
                              <span>{formatDuration(item.durationMinutes)}</span>
                              {item.hasQuiz && (
                                <span
                                  className={clsx(
                                    'flex items-center gap-0.5',
                                    item.quizResult?.passed ? 'text-accent-emerald' : 'text-amber-400'
                                  )}
                                >
                                  <HelpCircle className="h-2.5 w-2.5" aria-hidden="true" />
                                  {item.quizResult ? `${item.quizResult.score}%` : 'Quiz'}
                                </span>
                              )}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>
    </>
  );

  return (
    <div className="flex min-h-screen bg-ink-900">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-80 shrink-0 flex-col border-r border-ink-700/80 bg-ink-850/60 backdrop-blur-xl lg:flex">
        {sidebar}
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close curriculum"
            onClick={() => setSidebarOpen(false)}
            className="absolute inset-0 animate-fade-in bg-ink-950/80 backdrop-blur-sm"
          />
          <aside className="relative flex h-full w-[19rem] max-w-[88vw] animate-slide-in-right flex-col bg-ink-850 shadow-glow-lg">
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="btn-icon absolute right-3 top-3 z-10"
              aria-label="Close curriculum"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col" ref={contentRef}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-ink-700/80 bg-ink-900/90 px-4 backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="btn-icon lg:hidden"
            aria-label="Open curriculum"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {currentMeta?.title || 'Select a lesson'}
            </p>
            <p className="truncate text-2xs text-slate-500">
              Lesson {currentIndex + 1} of {flatLessons.length} · {progress.percentage}% complete
            </p>
          </div>

          <div className="hidden w-32 shrink-0 sm:block">
            <ProgressBar value={progress.percentage} size="xs" />
          </div>

          <ThemeToggle className="hidden sm:inline-flex" compact />

          <Link to="/student/courses" className="btn-icon" aria-label="Exit to my courses">
            <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
          </Link>
        </header>

        <main className="flex-1">
          {lessonLoading ? (
            <div className="flex h-96 items-center justify-center">
              <Spinner className="h-8 w-8" />
            </div>
          ) : !lesson ? (
            <div className="p-8">
              <InlineAlert tone="violet">Select a lesson from the curriculum to begin.</InlineAlert>
            </div>
          ) : showQuiz ? (
            <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
              <button
                type="button"
                onClick={() => setShowQuiz(false)}
                className="mb-4 flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-violet-300"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to the lesson
              </button>
              <QuizRunner
                lessonId={lesson.lesson._id}
                onPassed={onQuizPassed}
                onClose={() => setShowQuiz(false)}
              />
            </div>
          ) : (
            <>
              {/* Capped so the player does not tower over the text column on
                  a wide monitor, and stays edge-to-edge on a phone. */}
              <div className="mx-auto w-full max-w-5xl sm:px-6 sm:pt-6">
                <div className="overflow-hidden sm:rounded-2xl">
                  <LessonPlayer lesson={lesson.lesson} />
                </div>
              </div>

              <div className="mx-auto max-w-3xl px-4 py-7 sm:px-6">
                {/* Course-completion celebration */}
                {justFinished && (
                  <div className="surface-raised mb-7 overflow-hidden ring-1 ring-emerald-500/25">
                    <div className="bg-gradient-to-b from-emerald-500/12 to-transparent p-6 text-center">
                      <span className="mb-3 inline-grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/20 text-accent-emerald">
                        <Trophy className="h-7 w-7" aria-hidden="true" />
                      </span>
                      <h2 className="text-2xl">Course complete</h2>
                      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-400">
                        You finished every published lesson in {course.title}. Your certificate
                        {justFinished.certificate?.certificateId || justFinished.certificateId
                          ? ` (${justFinished.certificate?.certificateId || justFinished.certificateId})`
                          : ''}{' '}
                        has been issued.
                      </p>
                      <div className="mt-5 flex flex-wrap justify-center gap-3">
                        <Link to="/student/certificates" className="btn-primary">
                          <Award className="h-4 w-4" aria-hidden="true" />
                          View certificate
                        </Link>
                        <Link to={`/courses/${course.slug || course._id}`} className="btn-secondary">
                          Leave a review
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      {isDone && <Badge tone="emerald" icon={Check}>Completed</Badge>}
                      <Badge tone="slate" icon={Clock}>
                        {formatDuration(lesson.lesson.durationMinutes)}
                      </Badge>
                      {lesson.lesson.isPreview && <Badge tone="cyan">Free preview</Badge>}
                    </div>
                    <h1 className="text-2xl sm:text-3xl">{lesson.lesson.title}</h1>
                    {lesson.lesson.summary && (
                      <p className="mt-2 text-sm leading-relaxed text-slate-400">{lesson.lesson.summary}</p>
                    )}
                  </div>
                </div>

                {/* Primary lesson actions */}
                <div className="mb-7 flex flex-wrap gap-3 border-y border-ink-700/70 py-4">
                  <Button
                    variant={isDone ? 'secondary' : 'primary'}
                    icon={isDone ? RotateCcw : Check}
                    onClick={toggleComplete}
                    loading={marking}
                  >
                    {isDone ? 'Mark as not complete' : 'Mark as complete'}
                  </Button>

                  {lesson.quiz && (
                    <Button variant="secondary" icon={ListChecks} onClick={() => setShowQuiz(true)}>
                      {currentMeta?.quizResult
                        ? `Retake quiz (best ${currentMeta.quizResult.score}%)`
                        : `Take the quiz (${lesson.quiz.questionCount} questions)`}
                    </Button>
                  )}
                </div>

                {lesson.quiz?.isRequiredForCompletion && !currentMeta?.quizResult?.passed && (
                  <InlineAlert tone="amber" className="mb-7">
                    This lesson has a required quiz. Score {lesson.quiz.passingScore}% or higher on
                    &ldquo;{lesson.quiz.title}&rdquo; before marking the lesson complete.
                  </InlineAlert>
                )}

                {lesson.lesson.content && (
                  <section className="mb-9">
                    <h2 className="mb-3.5 text-lg">Lesson notes</h2>
                    <div className="prose-lesson whitespace-pre-line">{lesson.lesson.content}</div>
                  </section>
                )}

                {lesson.resources?.length > 0 && (
                  <div className="mb-9">
                    <ResourceList resources={lesson.resources} />
                  </div>
                )}

                {/* Prev / next */}
                <nav className="flex flex-col gap-3 border-t border-ink-700/70 pt-6 sm:flex-row sm:justify-between">
                  {previous ? (
                    <button
                      type="button"
                      onClick={() => setActiveId(String(previous._id))}
                      className="surface group flex min-w-0 flex-1 items-center gap-3 p-4 text-left transition-colors hover:border-violet-500/40"
                    >
                      <ArrowLeft className="h-4 w-4 shrink-0 text-slate-500 group-hover:text-violet-300" aria-hidden="true" />
                      <span className="min-w-0">
                        <span className="block text-2xs font-semibold uppercase tracking-wider text-slate-600">
                          Previous
                        </span>
                        <span className="mt-0.5 block truncate text-sm font-medium text-slate-300">
                          {previous.title}
                        </span>
                      </span>
                    </button>
                  ) : (
                    <span className="hidden flex-1 sm:block" />
                  )}

                  {next ? (
                    <button
                      type="button"
                      onClick={() => setActiveId(String(next._id))}
                      className="surface group flex min-w-0 flex-1 items-center justify-end gap-3 p-4 text-right transition-colors hover:border-violet-500/40"
                    >
                      <span className="min-w-0">
                        <span className="block text-2xs font-semibold uppercase tracking-wider text-slate-600">
                          Next
                        </span>
                        <span className="mt-0.5 block truncate text-sm font-medium text-slate-300">
                          {next.title}
                        </span>
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-slate-500 group-hover:text-violet-300" aria-hidden="true" />
                    </button>
                  ) : (
                    <div className="surface flex flex-1 items-center justify-center gap-2 p-4 text-sm text-slate-500">
                      {progress.isCompleted ? (
                        <>
                          <Trophy className="h-4 w-4 text-accent-emerald" aria-hidden="true" />
                          Course finished
                        </>
                      ) : (
                        'Last lesson in this course'
                      )}
                    </div>
                  )}
                </nav>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
