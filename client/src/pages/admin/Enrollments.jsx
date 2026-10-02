import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { CheckCircle2, Layers, Search } from 'lucide-react';
import { enrollmentApi } from '../../api/endpoints';
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Input,
  Pagination,
  ProgressBar,
  Select,
  Tabs,
  TableSkeleton,
} from '../../components/ui';
import { PageHeader } from '../../components/layout/BackButton';
import { formatDate, formatPrice, timeAgo } from '../../utils/format';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed' },
];

const PAYMENT_LABEL = {
  not_required: { label: 'Free', tone: 'badge-emerald' },
  waived: { label: 'Access granted', tone: 'badge-cyan' },
};

export default function AdminEnrollments() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [tab, setTab] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await enrollmentApi.adminList({
        page,
        limit: 20,
        ...(tab !== 'all' ? { status: tab } : {}),
        ...(paymentFilter !== 'all' ? { paymentStatus: paymentFilter } : {}),
      });
      setRows(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tab, page, paymentFilter]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-7">
      <PageHeader
        backTo="/admin"
        eyebrow="Platform management"
        title="Enrolments"
        description="Every enrolment on the platform, with live progress. All courses are free."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          tabs={TABS.map((item) => ({
            ...item,
            count: item.id === 'all' ? meta?.total : undefined,
          }))}
          active={tab}
          onChange={(next) => {
            setTab(next);
            setPage(1);
          }}
          className="flex-1"
        />

        <Select
          value={paymentFilter}
          onChange={(event) => {
            setPaymentFilter(event.target.value);
            setPage(1);
          }}
          aria-label="Filter by payment status"
          className="sm:w-56"
        >
          <option value="all">All payment states</option>
          <option value="not_required">Free courses</option>
            <option value="waived">Access granted</option>
        </Select>
      </div>

      <div className="surface-raised overflow-hidden">
        {loading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No enrolments match"
            description="Try a different tab or payment filter."
          />
        ) : (
          <>
            <div className="table-wrap p-4 sm:p-5">
              <table className="table min-w-[820px]">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Course</th>
                    <th>Instructor</th>
                    <th>Progress</th>
                    <th>Payment</th>
                    <th>Enrolled</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const payment = PAYMENT_LABEL[row.paymentStatus] || PAYMENT_LABEL.not_required;

                    return (
                      <tr key={row._id}>
                        <td>
                          <div className="flex items-center gap-2.5">
                            <Avatar src={row.student?.avatar} name={row.student?.name} size="sm" />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-white">{row.student?.name}</p>
                              <p className="truncate text-2xs text-slate-600">{row.student?.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="max-w-[15rem]">
                          {row.course ? (
                            <Link
                              to={`/courses/${row.course.slug || row.course._id}`}
                              className="line-clamp-2 text-violet-300 hover:text-violet-200"
                            >
                              {row.course.title}
                            </Link>
                          ) : (
                            <span className="text-slate-600">Deleted course</span>
                          )}
                          {row.course && (
                            <p className="mt-0.5 text-2xs text-slate-600">{formatPrice(row.course)}</p>
                          )}
                        </td>

                        <td className="text-xs text-slate-400">{row.instructor?.name || '—'}</td>

                        <td className="min-w-[9rem]">
                          <ProgressBar value={row.percentage} size="sm" />
                          <p className="mt-1 flex items-center gap-2 text-2xs">
                            <span
                              className={clsx(
                                'font-bold',
                                row.status === 'completed' ? 'text-accent-emerald' : 'text-violet-300'
                              )}
                            >
                              {row.percentage}%
                            </span>
                            {row.status === 'completed' && (
                              <Badge tone="emerald" icon={CheckCircle2}>
                                Done
                              </Badge>
                            )}
                          </p>
                        </td>

                        <td>
                          <span className={payment.tone}>{payment.label}</span>
                        </td>

                        <td className="whitespace-nowrap">
                          <p className="text-xs text-slate-400">{formatDate(row.enrolledAt)}</p>
                          <p className="text-2xs text-slate-600">
                            active {timeAgo(row.lastAccessedAt)}
                          </p>
                        </td>

                      </tr>
                    );
                  })}
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
