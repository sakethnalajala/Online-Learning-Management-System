import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import {
  ArrowRight,
  Atom,
  Award,
  BarChart3,
  Binary,
  BookOpen,
  Braces,
  BrainCircuit,
  Briefcase,
  ChartSpline,
  CheckCircle2,
  Cloud,
  Code2,
  Coffee,
  Database,
  FileCode2,
  GraduationCap,
  Hexagon,
  LayoutList,
  ListChecks,
  Palette,
  PenTool,
  PlayCircle,
  Server,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Terminal,
  TrendingUp,
  Users,
  Workflow,
} from 'lucide-react';

/**
 * Category icons are named in the database, so they are mapped explicitly here.
 * A namespace import would pull the entire icon set into the bundle.
 */
const CATEGORY_ICONS = {
  Atom,
  Binary,
  BookOpen,
  BrainCircuit,
  Braces,
  Briefcase,
  ChartSpline,
  Cloud,
  Code2,
  Coffee,
  Database,
  FileCode2,
  Hexagon,
  Palette,
  PenTool,
  Server,
  ShieldCheck,
  Smartphone,
  Terminal,
  TrendingUp,
  Workflow,
};
import { categoryApi, courseApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import CourseCard from '../../components/course/CourseCard';
import HeroShowcase from '../../components/public/HeroShowcase';
import { Button, CardSkeletonGrid, SectionHeading } from '../../components/ui';
import { compactNumber } from '../../utils/format';

const FEATURES = [
  {
    icon: LayoutList,
    title: 'Structured curricula',
    body: 'Courses are built as modules and lessons, each carrying its own videos, PDFs, notes and links — not a flat playlist you have to navigate yourself.',
  },
  {
    icon: BarChart3,
    title: 'Progress that means something',
    body: 'Completion is computed from the lessons you actually finished, against the lessons that are actually published. Your percentage is never inflated.',
  },
  {
    icon: ListChecks,
    title: 'Quizzes graded server-side',
    body: 'Answers are checked on the server, never in the browser. Retakes are encouraged, and your best score is the one that counts.',
  },
  {
    icon: Award,
    title: 'Verifiable certificates',
    body: 'Reach 100% and a certificate is issued with a public verification code, so anyone can confirm it without taking your word for it.',
  },
  {
    icon: ShieldCheck,
    title: 'Reviewed before publication',
    body: 'Every course passes an admin review before students can find it. Approval genuinely gates availability — it is not a rubber stamp.',
  },
  {
    icon: Users,
    title: 'Instructors see the truth',
    body: 'Real enrolment numbers, per-student progress and quiz pass rates, so instructors can tell which lesson is losing people.',
  },
];

const STEPS = [
  { title: 'Find a course', body: 'Search and filter the catalogue by category, level, price and rating.' },
  { title: 'Enrol', body: 'Free courses unlock immediately. Your enrolment creates a real record.' },
  { title: 'Work through it', body: 'Watch, read, download the resources, then mark each lesson complete.' },
  { title: 'Prove it', body: 'Pass the quizzes, hit 100%, and collect a certificate you can verify.' },
];

export default function Landing() {
  const { isAuthenticated, home } = useAuth();
  const [stats, setStats] = useState(null);
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    Promise.all([
      courseApi.publicStats().catch(() => null),
      courseApi.featured(6).catch(() => []),
      categoryApi.list({ withCounts: true }).catch(() => []),
    ]).then(([statsData, featured, cats]) => {
      if (!alive) return;
      setStats(statsData);
      setCourses(featured);
      setCategories(cats);
      setLoading(false);
    });

    return () => {
      alive = false;
    };
  }, []);

  // Populated categories first, so the grid does not open with empty ones.
  const sortedCategories = [...categories].sort(
    (a, b) => (b.courseCount || 0) - (a.courseCount || 0) || a.name.localeCompare(b.name)
  );

  const counters = [
    { label: 'Published courses', value: stats?.courses, icon: BookOpen },
    { label: 'Learners', value: stats?.students, icon: Users },
    { label: 'Instructors', value: stats?.instructors, icon: GraduationCap },
    { label: 'Enrolments', value: stats?.enrollments, icon: CheckCircle2 },
  ];

  return (
    <>
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-hero-glow">
        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 sm:pt-24 lg:px-8 lg:pb-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="animate-fade-up">
              <span className="badge-violet mb-6 inline-flex">
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                Full-stack learning platform
              </span>

              <h1 className="text-4xl leading-[1.08] sm:text-5xl lg:text-6xl">
                Learn something<br />
                <span className="text-gradient">you can prove</span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
                Structured courses from working practitioners, progress tracked against real lesson
                completion, quizzes marked on the server, and a certificate at the end that anyone can
                verify. No inflated percentages, no participation trophies.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                {isAuthenticated ? (
                  <Link to={home} className="btn-primary btn-lg">
                    Go to dashboard
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                ) : (
                  <Link to="/get-started" className="btn-primary btn-lg">
                    Start learning free
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                )}
                <Link to="/courses" className="btn-secondary btn-lg">
                  <PlayCircle className="h-4 w-4" aria-hidden="true" />
                  Browse the catalogue
                </Link>
              </div>

              <dl className="mt-12 grid max-w-lg grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
                {counters.map((item) => (
                  <div key={item.label}>
                    <dd className="font-display text-2xl font-extrabold text-white sm:text-3xl">
                      {item.value == null ? '—' : compactNumber(item.value)}
                    </dd>
                    <dt className="mt-0.5 text-xs font-medium text-slate-500">{item.label}</dt>
                  </div>
                ))}
              </dl>
            </div>

            {/* The product itself, layered and parallaxed — see HeroShowcase. */}
            <div className="animate-fade-up [animation-delay:120ms]">
              <HeroShowcase />
            </div>
          </div>
        </div>
      </section>

      {/* ── Categories ─────────────────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Explore"
            title="Browse by category"
            description={`${categories.length} subject areas, every course reviewed before it went live.`}
          />

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {sortedCategories.map((category) => {
              const Icon = CATEGORY_ICONS[category.icon] || BookOpen;
              return (
                <Link
                  key={category._id}
                  to={`/courses?category=${category._id}`}
                  className="surface-interactive group flex items-center gap-3 p-4"
                >
                  <span
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                    style={{ background: `${category.color}22`, color: category.color }}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-white">{category.name}</span>
                    <span className="block text-xs text-slate-500">
                      {category.courseCount || 0} course{category.courseCount === 1 ? '' : 's'}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Featured courses ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Popular right now"
          title="Featured courses"
          description="The courses students are enrolling in and finishing."
          action={
            <Link to="/courses" className="btn-secondary">
              View all
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          }
        />

        <div className="mt-8">
          {loading ? (
            <CardSkeletonGrid count={6} />
          ) : courses.length === 0 ? (
            <p className="surface px-6 py-12 text-center text-sm text-slate-500">
              No published courses yet. Run the database seed to populate the catalogue.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {courses.map((course) => (
                <CourseCard key={course._id} course={course} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────── */}
      <section className="border-y border-ink-700/60 bg-ink-950/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="How it works" title="From browsing to a certificate" />

          <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <li key={step.title} className="relative">
                <span className="font-display text-5xl font-extrabold text-violet-500/25">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-2 text-lg">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{step.body}</p>
                {index < STEPS.length - 1 && (
                  <ArrowRight
                    className="absolute -right-3 top-8 hidden h-4 w-4 text-ink-500 lg:block"
                    aria-hidden="true"
                  />
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Built properly"
          title="What makes this different"
          description="The parts of a learning platform that usually get faked, done for real instead."
        />

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="surface-interactive p-6">
              <span className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-violet-soft text-violet-300 ring-1 ring-inset ring-violet-500/20">
                <feature.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mb-2 text-base">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-slate-400">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Dual CTA ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="surface-raised relative overflow-hidden p-8 sm:p-10">
            <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-violet-600/15 blur-3xl" aria-hidden="true" />
            <GraduationCap className="mb-5 h-9 w-9 text-violet-400" aria-hidden="true" />
            <h3 className="text-2xl">Learn a skill properly</h3>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-400">
              Free courses to start, progress you can trust, and a certificate when you have genuinely
              finished. No credit card, no trial countdown.
            </p>
            <Link to={isAuthenticated ? '/courses' : '/get-started'} className="btn-primary mt-7">
              {isAuthenticated ? 'Find a course' : 'Create a free account'}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="surface-raised relative overflow-hidden p-8 sm:p-10">
            <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" aria-hidden="true" />
            <BookOpen className="mb-5 h-9 w-9 text-accent-cyan" aria-hidden="true" />
            <h3 className="text-2xl">Teach what you know</h3>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-400">
              Build a course as modules and lessons, attach any resource type, write quizzes, and watch
              exactly where your students get stuck.
            </p>
            <Link to="/register?role=instructor" className="btn-secondary mt-7">
              Become an instructor
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
