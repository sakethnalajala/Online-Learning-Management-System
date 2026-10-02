import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Award, BookOpen, Github, Globe, Linkedin, Star, Twitter, Users } from 'lucide-react';
import { userApi } from '../../api/endpoints';
import CourseCard from '../../components/course/CourseCard';
import {
  Avatar,
  EmptyState,
  ErrorState,
  PageLoader,
  StatCard,
} from '../../components/ui';
import { PageHeader } from '../../components/layout/BackButton';
import { compactNumber } from '../../utils/format';

const SOCIALS = [
  { key: 'linkedin', icon: Linkedin, label: 'LinkedIn' },
  { key: 'github', icon: Github, label: 'GitHub' },
  { key: 'twitter', icon: Twitter, label: 'Twitter' },
];

export default function InstructorProfile() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await userApi.instructorProfile(id));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <PageLoader label="Loading instructor" />;
  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ErrorState message={error || 'Instructor not found.'} onRetry={load} />
      </div>
    );
  }

  const { instructor, courses, stats } = data;

  return (
    <div>
      <section className="border-b border-ink-700/60 bg-hero-glow">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:gap-8">
            <Avatar src={instructor.avatar} name={instructor.name} size="2xl" ring />

            <div className="min-w-0 flex-1">
              <span className="badge-violet mb-3 inline-flex">Instructor</span>
              <h1 className="text-3xl sm:text-4xl">{instructor.name}</h1>
              {instructor.headline && (
                <p className="mt-2 text-base text-violet-300">{instructor.headline}</p>
              )}

              {instructor.bio && (
                <p className="mt-5 max-w-2xl whitespace-pre-line text-sm leading-relaxed text-slate-400">
                  {instructor.bio}
                </p>
              )}

              {instructor.expertise?.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {instructor.expertise.map((skill) => (
                    <span key={skill} className="badge-slate">
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                {instructor.website && (
                  <a
                    href={instructor.website}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="btn-secondary btn-sm"
                  >
                    <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                    Website
                  </a>
                )}
                {SOCIALS.map(
                  (social) =>
                    instructor.social?.[social.key] && (
                      <a
                        key={social.key}
                        href={instructor.social[social.key]}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="btn-secondary btn-sm"
                      >
                        <social.icon className="h-3.5 w-3.5" aria-hidden="true" />
                        {social.label}
                      </a>
                    )
                )}
              </div>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Courses" value={stats.totalCourses} icon={BookOpen} tone="violet" />
            <StatCard
              label="Students"
              value={compactNumber(stats.totalStudents)}
              icon={Users}
              tone="cyan"
            />
            <StatCard
              label="Average rating"
              value={stats.averageRating || '—'}
              icon={Star}
              tone="amber"
              hint={`${stats.totalReviews} review${stats.totalReviews === 1 ? '' : 's'}`}
            />
            <StatCard label="Reviews" value={stats.totalReviews} icon={Award} tone="pink" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <PageHeader
        backTo="/courses"
          title={`Courses by ${instructor.name.split(' ')[0]}`}
          description="Every published course from this instructor."
        />

        <div className="mt-8">
          {courses.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No published courses yet"
              description="This instructor has not published a course at the moment."
              action={
                <Link to="/courses" className="btn-secondary">
                  Browse the catalogue
                </Link>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {courses.map((course) => (
                <CourseCard key={course._id} course={{ ...course, instructor }} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
