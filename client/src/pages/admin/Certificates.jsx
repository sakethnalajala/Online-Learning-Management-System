import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, ExternalLink, Search, ShieldCheck } from 'lucide-react';
import { certificateApi } from '../../api/endpoints';
import {
  Avatar,
  EmptyState,
  ErrorState,
  Input,
  Pagination,
  StatCard,
  TableSkeleton,
} from '../../components/ui';
import { PageHeader } from '../../components/layout/BackButton';
import { formatDate, timeAgo } from '../../utils/format';

export default function AdminCertificates() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await certificateApi.adminList({ page, limit: 20 });
      setRows(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  // Client-side filter: the list is paginated server-side, this narrows the page.
  const term = search.trim().toLowerCase();
  const filtered = term
    ? rows.filter(
        (row) =>
          row.studentName?.toLowerCase().includes(term) ||
          row.courseTitle?.toLowerCase().includes(term) ||
          row.certificateId?.toLowerCase().includes(term)
      )
    : rows;

  return (
    <div className="space-y-7">
      <PageHeader
        backTo="/admin"
        eyebrow="Platform management"
        title="Issued certificates"
        description="Every certificate the platform has issued. Each is produced automatically when a student completes all published lessons in a course."
        action={
          <Link to="/verify" className="btn-secondary">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Verification page
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard
          label="Total issued"
          value={meta?.total ?? '—'}
          icon={Award}
          tone="amber"
        />
        <StatCard
          label="On this page"
          value={rows.length}
          icon={Award}
          tone="violet"
          hint={meta ? `Page ${meta.page} of ${meta.totalPages}` : undefined}
        />
        <StatCard
          label="Revoked"
          value={rows.filter((row) => row.isRevoked).length}
          icon={ShieldCheck}
          tone="rose"
          hint="Revoked certificates fail verification"
        />
      </div>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Filter this page by student, course or certificate ID…"
          aria-label="Filter certificates"
          className="pl-10"
        />
      </div>

      <div className="surface-raised overflow-hidden">
        {loading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Award}
            title={rows.length === 0 ? 'No certificates issued yet' : 'Nothing matches that filter'}
            description={
              rows.length === 0
                ? 'Certificates appear here as soon as students start completing courses.'
                : 'Try a different search term, or clear the filter.'
            }
          />
        ) : (
          <>
            <div className="table-wrap p-4 sm:p-5">
              <table className="table">
                <thead>
                  <tr>
                    <th>Certificate ID</th>
                    <th>Student</th>
                    <th>Course</th>
                    <th className="text-center">Lessons</th>
                    <th className="text-center">Quiz avg</th>
                    <th>Issued</th>
                    <th className="text-right">Verify</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr key={row._id}>
                      <td>
                        <span className="font-mono text-xs text-violet-300">{row.certificateId}</span>
                        {row.isRevoked && <p className="badge-rose mt-1 inline-flex">Revoked</p>}
                      </td>

                      <td>
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            src={row.student?.avatar}
                            name={row.student?.name || row.studentName}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-white">
                              {row.student?.name || row.studentName}
                            </p>
                            {row.student?.email && (
                              <p className="truncate text-2xs text-slate-600">{row.student.email}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="max-w-[16rem]">
                        {row.course ? (
                          <Link
                            to={`/courses/${row.course.slug || row.course._id}`}
                            className="line-clamp-2 text-violet-300 hover:text-violet-200"
                          >
                            {row.courseTitle}
                          </Link>
                        ) : (
                          <span className="line-clamp-2 text-slate-400">{row.courseTitle}</span>
                        )}
                      </td>

                      <td className="text-center tabular-nums text-slate-400">
                        {row.totalLessons || '—'}
                      </td>

                      <td className="text-center tabular-nums text-slate-400">
                        {row.averageQuizScore ? `${row.averageQuizScore}%` : '—'}
                      </td>

                      <td className="whitespace-nowrap">
                        <p className="text-xs text-slate-400">{timeAgo(row.issuedAt)}</p>
                        <p className="text-2xs text-slate-600">{formatDate(row.issuedAt)}</p>
                      </td>

                      <td className="text-right">
                        <Link
                          to={`/verify/${row.certificateId}`}
                          className="btn-icon inline-grid"
                          aria-label={`Verify ${row.certificateId}`}
                        >
                          <ExternalLink className="h-4 w-4" aria-hidden="true" />
                        </Link>
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
    </div>
  );
}
