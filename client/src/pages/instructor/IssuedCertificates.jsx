import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, ExternalLink, Search } from 'lucide-react';
import { certificateApi } from '../../api/endpoints';
import {
  Avatar,
  EmptyState,
  ErrorState,
  Input,
  PageLoader,
  StatCard,
} from '../../components/ui';
import { PageHeader } from '../../components/layout/BackButton';
import { formatDate, timeAgo } from '../../utils/format';

export default function IssuedCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    certificateApi
      .issuedByMyCourses()
      .then(setCertificates)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return certificates;
    return certificates.filter(
      (certificate) =>
        certificate.studentName?.toLowerCase().includes(term) ||
        certificate.courseTitle?.toLowerCase().includes(term) ||
        certificate.certificateId?.toLowerCase().includes(term)
    );
  }, [certificates, search]);

  // How many certificates each course has produced.
  const byCourse = useMemo(() => {
    const counts = new Map();
    for (const certificate of certificates) {
      const key = certificate.courseTitle;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [certificates]);

  if (loading) return <PageLoader label="Loading certificates" />;
  if (error) return <ErrorState message={error} />;

  const averageScore = certificates.length
    ? Math.round(
        certificates.reduce((sum, c) => sum + (c.averageQuizScore || 0), 0) / certificates.length
      )
    : 0;

  return (
    <div className="space-y-7">
      <PageHeader
        backTo="/instructor"
        title="Certificates issued"
        description="Students who completed one of your courses. Certificates are issued automatically at 100%."
      />

      {certificates.length === 0 ? (
        <div className="surface-raised">
          <EmptyState
            icon={Award}
            title="No certificates issued yet"
            description="When a student finishes every published lesson in one of your courses, a certificate is issued and appears here."
            action={
              <Link to="/instructor/courses" className="btn-primary">
                Manage my courses
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <StatCard label="Certificates issued" value={certificates.length} icon={Award} tone="amber" />
            <StatCard
              label="Courses completed"
              value={byCourse.length}
              icon={Award}
              tone="violet"
              hint="Distinct courses with a completion"
            />
            <StatCard
              label="Average quiz score"
              value={averageScore ? `${averageScore}%` : '—'}
              icon={Award}
              tone="emerald"
              hint="Across all certificates"
            />
          </div>

          {byCourse.length > 1 && (
            <div className="surface-raised p-5">
              <h3 className="mb-3.5 text-base">Completions per course</h3>
              <ul className="space-y-2">
                {byCourse.map(([title, count]) => (
                  <li key={title} className="flex items-center gap-3 text-sm">
                    <span className="min-w-0 flex-1 truncate text-slate-300">{title}</span>
                    <span className="badge-violet shrink-0">{count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by student, course or certificate ID…"
              aria-label="Search certificates"
              className="pl-10"
            />
          </div>

          <div className="surface-raised overflow-hidden">
            {filtered.length === 0 ? (
              <EmptyState icon={Search} title="Nothing matches" description="Try a different search term." />
            ) : (
              <div className="table-wrap p-4 sm:p-5">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Course</th>
                      <th>Certificate ID</th>
                      <th className="text-center">Quiz avg</th>
                      <th>Issued</th>
                      <th className="text-right">Verify</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((certificate) => (
                      <tr key={certificate._id}>
                        <td>
                          <div className="flex items-center gap-2.5">
                            <Avatar
                              src={certificate.student?.avatar}
                              name={certificate.student?.name || certificate.studentName}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-white">
                                {certificate.student?.name || certificate.studentName}
                              </p>
                              {certificate.student?.email && (
                                <p className="truncate text-2xs text-slate-600">
                                  {certificate.student.email}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="max-w-[16rem]">
                          <span className="line-clamp-2 text-slate-300">{certificate.courseTitle}</span>
                        </td>

                        <td>
                          <span className="font-mono text-xs text-violet-300">
                            {certificate.certificateId}
                          </span>
                        </td>

                        <td className="text-center tabular-nums text-slate-400">
                          {certificate.averageQuizScore ? `${certificate.averageQuizScore}%` : '—'}
                        </td>

                        <td className="whitespace-nowrap">
                          <p className="text-slate-400">{timeAgo(certificate.issuedAt)}</p>
                          <p className="text-2xs text-slate-600">{formatDate(certificate.issuedAt)}</p>
                        </td>

                        <td className="text-right">
                          <Link
                            to={`/verify/${certificate.certificateId}`}
                            className="btn-secondary btn-sm"
                            title="Public verification page"
                          >
                            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
