import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, BookOpen, Clock, ExternalLink, Layers, ShieldCheck } from 'lucide-react';
import { certificateApi } from '../../api/endpoints';
import {
  Avatar,
  Button,
  EmptyState,
  ErrorState,
  Skeleton,
} from '../../components/ui';
import { PageHeader } from '../../components/layout/BackButton';
import { formatDate } from '../../utils/format';

export default function Certificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setCertificates(await certificateApi.mine());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-7">
      <PageHeader
        backTo="/student"
        title="My certificates"
        description="Issued automatically when you complete every published lesson in a course. Each one carries a code anyone can verify."
        action={
          <Link to="/verify" className="btn-secondary">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Verification page
          </Link>
        }
      />

      {loading ? (
        <div className="grid gap-5 md:grid-cols-2">
          {[0, 1].map((index) => (
            <Skeleton key={index} className="h-56 rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : certificates.length === 0 ? (
        <div className="surface-raised">
          <EmptyState
            icon={Award}
            title="No certificates yet"
            description="Complete every lesson in a course and a certificate is issued automatically — no need to apply for it."
            action={
              <Link to="/student/courses" className="btn-primary">
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                Go to my courses
              </Link>
            }
          />
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {certificates.map((certificate) => (
            <article key={certificate._id} className="surface-interactive overflow-hidden">
              {/* Decorative certificate header */}
              <div className="relative overflow-hidden border-b border-ink-700/70 bg-gradient-to-br from-violet-900/35 via-ink-850 to-ink-900 p-6">
                <div
                  className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-amber-500/10 blur-2xl"
                  aria-hidden="true"
                />
                <div className="relative flex items-start justify-between gap-4">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-amber-500/15 text-accent-amber ring-1 ring-inset ring-amber-500/25">
                    <Award className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <span className="rounded-lg bg-ink-950/60 px-2.5 py-1 font-mono text-2xs text-violet-300">
                    {certificate.certificateId}
                  </span>
                </div>

                <h3 className="relative mt-4 line-clamp-2 text-lg leading-snug">
                  {certificate.courseTitle}
                </h3>
                <p className="relative mt-1.5 text-xs text-slate-400">
                  Awarded to <span className="font-semibold text-white">{certificate.studentName}</span>
                </p>
              </div>

              <div className="p-5">
                {certificate.instructor && (
                  <div className="mb-4 flex items-center gap-2.5">
                    <Avatar src={certificate.instructor.avatar} name={certificate.instructor.name} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-300">
                        {certificate.instructor.name}
                      </p>
                      <p className="text-2xs text-slate-600">Instructor</p>
                    </div>
                  </div>
                )}

                <dl className="grid grid-cols-3 gap-3 border-y border-ink-700/70 py-3.5 text-center">
                  <div>
                    <dt className="text-2xs font-semibold uppercase tracking-wider text-slate-600">
                      Lessons
                    </dt>
                    <dd className="mt-0.5 font-display text-base font-bold text-white">
                      {certificate.totalLessons || '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-2xs font-semibold uppercase tracking-wider text-slate-600">
                      Hours
                    </dt>
                    <dd className="mt-0.5 font-display text-base font-bold text-white">
                      {certificate.hoursOfContent || '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-2xs font-semibold uppercase tracking-wider text-slate-600">
                      Quiz avg
                    </dt>
                    <dd className="mt-0.5 font-display text-base font-bold text-white">
                      {certificate.averageQuizScore ? `${certificate.averageQuizScore}%` : '—'}
                    </dd>
                  </div>
                </dl>

                <p className="mt-3.5 flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  Issued {formatDate(certificate.issuedAt)}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link to={`/student/certificates/${certificate._id}`} className="btn-primary btn-sm flex-1">
                    View certificate
                  </Link>
                  <Link
                    to={`/verify/${certificate.certificateId}`}
                    className="btn-secondary btn-sm"
                    title="Public verification page"
                  >
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    Verify
                  </Link>
                  {certificate.course && (
                    <Link
                      to={`/courses/${certificate.course.slug || certificate.course._id}`}
                      className="btn-secondary btn-sm"
                      title="Course page"
                    >
                      <Layers className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
