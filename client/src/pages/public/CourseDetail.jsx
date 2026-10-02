import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock,
  Globe,
  Layers,
  Lock,
  PlayCircle,
  Star,
  Tag,
  Users,
} from 'lucide-react';
import { courseApi, enrollmentApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/layout/BackButton';
import Curriculum from '../../components/course/Curriculum';
import Reviews from '../../components/course/Reviews';
import {
  Avatar,
  Badge,
  Button,
  CheckPill,
  ErrorState,
  InlineAlert,
  PageLoader,
  ProgressBar,
  StarRating,
  Tabs,
} from '../../components/ui';
import { assetUrl } from '../../api/client';
import {
  LEVEL_META,
  compactNumber,
  discountPercent,
  formatDuration,
  formatOriginalPrice,
  formatPrice,
  youtubeEmbed,
  youtubeThumb,
} from '../../utils/format';

const TABS = [
  { id: 'overview', label: 'Overview', icon: BookOpen },
  { id: 'curriculum', label: 'Curriculum', icon: Layers },
  { id: 'instructor', label: 'Instructor', icon: Users },
  { id: 'reviews', label: 'Reviews', icon: Star },
];

export default function CourseDetail() {
  const { idOrSlug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isStudent, user } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('overview');
  const [enrolling, setEnrolling] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await courseApi.get(idOrSlug));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [idOrSlug]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <PageLoader label="Loading course" />;

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ErrorState message={error || 'Course not found.'} onRetry={load} />
        <div className="mt-6 text-center">
          <Link to="/courses" className="btn-secondary">
            Back to the catalogue
          </Link>
        </div>
      </div>
    );
  }

  const { course, curriculum, enrollment, progress, isEnrolled, canEdit, meta } = data;
  const level = LEVEL_META[course.level] || LEVEL_META.beginner;
  const discount = discountPercent(course);
  const original = formatOriginalPrice(course);
  const embed = youtubeEmbed(course.promoVideoUrl);
  const poster = assetUrl(course.thumbnail) || youtubeThumb(course.promoVideoUrl);
  const paymentPending = enrollment?.paymentStatus === 'pending_payment';
  const isOwnCourse = String(course.instructor?._id) === String(user?._id);

  const enroll = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/courses/${idOrSlug}` } });
      return;
    }
    if (!isStudent) {
      toast.error('Only student accounts can enrol in courses.');
      return;
    }

    setEnrolling(true);
    try {
      const result = await enrollmentApi.enroll(course._id);
      if (result.requiresPayment) {
        toast.success('Enrolment recorded. This is a paid course, so content stays locked until access is granted.', {
          duration: 6500,
        });
      } else {
        toast.success('You are enrolled. Happy learning!');
      }
      await load();
      if (!result.requiresPayment) navigate(`/learn/${course._id}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setEnrolling(false);
    }
  };

  /** Primary action changes with the viewer's relationship to the course. */
  const primaryAction = () => {
    if (canEdit) {
      return (
        <Link to={`/instructor/courses/${course._id}`} className="btn-primary btn-lg w-full">
          Manage this course
        </Link>
      );
    }
    if (isEnrolled && !paymentPending) {
      return (
        <Link to={`/learn/${course._id}`} className="btn-primary btn-lg w-full">
          {progress?.percentage > 0 ? 'Continue learning' : 'Start learning'}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      );
    }
    if (paymentPending) {
      return (
        <Button size="lg" className="w-full" disabled icon={Lock}>
          Awaiting access
        </Button>
      );
    }
    return (
      <Button size="lg" className="w-full" onClick={enroll} loading={enrolling}>
        {course.isFree ? 'Enrol for free' : `Enrol · ${formatPrice(course)}`}
      </Button>
    );
  };

  return (
    <div className="relative bg-hero-glow">
      {/* One grid for the whole page: the access card stays beside the content
          instead of leaving a dead column once the hero ends. */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div>
          {/* Returns to wherever the course was opened from — My Courses,
              search results or the admin list — falling back to the catalogue. */}
          <BackButton to="/courses" label="Back" className="mb-3" />

          <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-slate-500" aria-label="Breadcrumb">
            <Link to="/courses" className="hover:text-violet-300">
              Courses
            </Link>
            <span aria-hidden="true">/</span>
            {course.category && (
              <>
                <Link to={`/courses?category=${course.category._id}`} className="hover:text-violet-300">
                  {course.category.name}
                </Link>
                <span aria-hidden="true">/</span>
              </>
            )}
            <span className="truncate text-slate-400">{course.title}</span>
          </nav>

          <div className="grid gap-10 lg:grid-cols-[1fr_22rem] xl:grid-cols-[1fr_24rem]">
            <div className="min-w-0">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {course.category && (
                  <span
                    className="badge"
                    style={{
                      background: `${course.category.color}1f`,
                      color: course.category.color,
                      boxShadow: `inset 0 0 0 1px ${course.category.color}44`,
                    }}
                  >
                    {course.category.name}
                  </span>
                )}
                <span className={level.className}>{level.label}</span>
                {course.isFree && <Badge tone="emerald">Free</Badge>}
                {course.isFeatured && <Badge tone="amber">Featured</Badge>}
                {canEdit && course.status !== 'published' && (
                  <Badge tone="slate">Status: {course.status}</Badge>
                )}
              </div>

              <h1 className="text-3xl leading-tight sm:text-4xl lg:text-[2.75rem]">{course.title}</h1>

              {course.subtitle && (
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-400">{course.subtitle}</p>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2.5 text-sm text-slate-400">
                {course.ratingCount > 0 ? (
                  <StarRating value={course.ratingAverage} count={course.ratingCount} />
                ) : (
                  <span className="text-slate-600">No ratings yet</span>
                )}
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" aria-hidden="true" />
                  {compactNumber(course.enrollmentCount)} enrolled
                </span>
                <span className="flex items-center gap-1.5">
                  <Globe className="h-4 w-4" aria-hidden="true" />
                  {course.language}
                </span>
              </div>

              {course.instructor && (
                <Link
                  to={`/instructors/${course.instructor._id}`}
                  className="mt-6 inline-flex items-center gap-3 rounded-xl p-2 -ml-2 transition-colors hover:bg-ink-800"
                >
                  <Avatar src={course.instructor.avatar} name={course.instructor.name} size="md" />
                  <span>
                    <span className="block text-sm font-semibold text-white">{course.instructor.name}</span>
                    {course.instructor.headline && (
                      <span className="block text-xs text-slate-500">{course.instructor.headline}</span>
                    )}
                  </span>
                </Link>
              )}
              {/* Tabs and body sit in the same column, so the access card
                  stays alongside them instead of leaving a dead gutter. */}
              <div className="mt-12 border-t border-ink-700/60 pt-8">
            <Tabs
              tabs={TABS.map((item) =>
                item.id === 'reviews' ? { ...item, count: meta?.reviewCount } : item
              )}
              active={tab}
              onChange={setTab}
            />

            <div className="mt-8">
              {tab === 'overview' && (
                <div className="space-y-10">
                  {course.whatYouWillLearn?.length > 0 && (
                    <div className="surface p-6">
                      <h2 className="mb-4 text-xl">What you will learn</h2>
                      <ul className="grid gap-3 sm:grid-cols-2">
                        {course.whatYouWillLearn.map((item) => (
                          <CheckPill key={item}>{item}</CheckPill>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div>
                    <h2 className="mb-4 text-xl">About this course</h2>
                    <div className="prose-lesson whitespace-pre-line">{course.description}</div>
                  </div>

                  {course.requirements?.length > 0 && (
                    <div>
                      <h2 className="mb-4 text-xl">Requirements</h2>
                      <ul className="space-y-2.5">
                        {course.requirements.map((item) => (
                          <li key={item} className="flex items-start gap-2.5 text-sm text-slate-300">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {course.tags?.length > 0 && (
                    <div>
                      <h2 className="mb-3 text-xl">Topics covered</h2>
                      <div className="flex flex-wrap gap-2">
                        {course.tags.map((tag) => (
                          <Link
                            key={tag}
                            to={`/courses?search=${encodeURIComponent(tag)}`}
                            className="badge-slate transition-colors hover:bg-violet-500/15 hover:text-violet-300"
                          >
                            <Tag className="h-3 w-3" aria-hidden="true" />
                            {tag}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {tab === 'curriculum' && (
                <Curriculum
                  curriculum={curriculum}
                  isEnrolled={isEnrolled && !paymentPending}
                  courseId={course._id}
                  completedIds={progress?.completedLessons?.map((entry) => entry.lesson) || []}
                />
              )}

              {tab === 'instructor' && course.instructor && (
                <div className="surface p-6">
                  <div className="flex flex-wrap items-start gap-5">
                    <Avatar src={course.instructor.avatar} name={course.instructor.name} size="xl" ring />
                    <div className="min-w-0 flex-1">
                      <h2 className="text-xl">{course.instructor.name}</h2>
                      {course.instructor.headline && (
                        <p className="mt-1 text-sm text-violet-300">{course.instructor.headline}</p>
                      )}
                      <p className="mt-1.5 text-xs text-slate-500">
                        {meta?.instructorCourseCount || 0} published course
                        {meta?.instructorCourseCount === 1 ? '' : 's'} on Lumina
                      </p>
                    </div>
                  </div>

                  {course.instructor.bio && (
                    <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-slate-300">
                      {course.instructor.bio}
                    </p>
                  )}

                  {course.instructor.expertise?.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {course.instructor.expertise.map((skill) => (
                        <span key={skill} className="badge-violet">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  <Link
                    to={`/instructors/${course.instructor._id}`}
                    className="btn-secondary mt-6"
                  >
                    View full profile
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              )}

              {tab === 'reviews' && (
                <Reviews
                  courseId={course._id}
                  canReview={isStudent && isEnrolled}
                  onRatingChange={load}
                />
              )}
            </div>
              </div>
            </div>

            {/* ── Sticky purchase / access card ────────────────────────── */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="surface-raised overflow-hidden">
                <div className="relative aspect-video bg-ink-800">
                  {showVideo && embed ? (
                    <iframe
                      src={`${embed}&autoplay=1`}
                      title={`${course.title} preview`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                      allowFullScreen
                      className="h-full w-full"
                    />
                  ) : (
                    <>
                      {poster ? (
                        <img src={poster} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="grid h-full place-items-center bg-gradient-to-br from-violet-900/50 via-ink-800 to-ink-850">
                          <BookOpen className="h-10 w-10 text-violet-500/60" aria-hidden="true" />
                        </div>
                      )}
                      {embed && (
                        <button
                          type="button"
                          onClick={() => setShowVideo(true)}
                          className="absolute inset-0 grid place-items-center bg-ink-950/45 transition-colors hover:bg-ink-950/25"
                          aria-label="Play course preview"
                        >
                          <span className="grid h-14 w-14 place-items-center rounded-full bg-violet-600 shadow-glow transition-transform hover:scale-110">
                            <PlayCircle className="h-7 w-7 text-white" aria-hidden="true" />
                          </span>
                        </button>
                      )}
                    </>
                  )}
                </div>

                <div className="space-y-4 p-5">
                  {!isEnrolled && !canEdit && (
                    <div className="flex items-end gap-2.5">
                      <span
                        className={clsx(
                          'font-display text-3xl font-extrabold',
                          course.isFree ? 'text-accent-emerald' : 'text-white'
                        )}
                      >
                        {formatPrice(course)}
                      </span>
                      {original && <span className="pb-1 text-sm text-slate-600 line-through">{original}</span>}
                      {discount && <Badge tone="rose" className="mb-1.5">{discount}% off</Badge>}
                    </div>
                  )}

                  {isEnrolled && progress && !paymentPending && (
                    <ProgressBar
                      value={progress.percentage}
                      label="Your progress"
                      showLabel
                      size="md"
                    />
                  )}

                  {primaryAction()}

                  {paymentPending && (
                    <InlineAlert tone="amber" icon={AlertCircle}>
                      This is a paid course. No payment provider is connected to this build, so an
                      administrator has to grant access before the content unlocks.
                    </InlineAlert>
                  )}

                  {isOwnCourse && !canEdit && (
                    <p className="text-center text-xs text-slate-500">This is your own course.</p>
                  )}

                  <ul className="space-y-2.5 border-t border-ink-700/70 pt-4 text-sm">
                    <li className="flex items-center gap-2.5 text-slate-400">
                      <Layers className="h-4 w-4 shrink-0 text-violet-400" aria-hidden="true" />
                      {course.moduleCount} module{course.moduleCount === 1 ? '' : 's'}
                    </li>
                    <li className="flex items-center gap-2.5 text-slate-400">
                      <PlayCircle className="h-4 w-4 shrink-0 text-violet-400" aria-hidden="true" />
                      {course.lessonCount} lesson{course.lessonCount === 1 ? '' : 's'}
                    </li>
                    <li className="flex items-center gap-2.5 text-slate-400">
                      <Clock className="h-4 w-4 shrink-0 text-violet-400" aria-hidden="true" />
                      {formatDuration(course.totalDurationMinutes)} of content
                    </li>
                    <li className="flex items-center gap-2.5 text-slate-400">
                      <BarChart3 className="h-4 w-4 shrink-0 text-violet-400" aria-hidden="true" />
                      {level.label} level
                    </li>
                    <li className="flex items-center gap-2.5 text-slate-400">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-violet-400" aria-hidden="true" />
                      Certificate on completion
                    </li>
                  </ul>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
