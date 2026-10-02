import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BookMarked, Compass, Trash2 } from 'lucide-react';
import { enrollmentApi } from '../../api/endpoints';
import CourseCard from '../../components/course/CourseCard';
import {
  Button,
  CardSkeletonGrid,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Pagination,
  Tabs,
} from '../../components/ui';
import { PageHeader } from '../../components/layout/BackButton';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'In progress' },
  { id: 'completed', label: 'Completed' },
];

export default function MyCourses() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [tab, setTab] = useState('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [target, setTarget] = useState(null);
  const [removing, setRemoving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await enrollmentApi.mine({
        page,
        limit: 12,
        ...(tab !== 'all' ? { status: tab } : {}),
      });
      setRows(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  useEffect(() => {
    load();
  }, [load]);

  const unenroll = async () => {
    setRemoving(true);
    try {
      await enrollmentApi.unenroll(target._id);
      toast.success('You have been withdrawn from that course.');
      setTarget(null);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRemoving(false);
    }
  };

  const counts = {
    all: meta?.total,
    active: undefined,
    completed: undefined,
  };

  return (
    <div className="space-y-7">
      <PageHeader
        backTo="/student"
        title="My courses"
        description="Everything you are enrolled in, with live progress."
        action={
          <Link to="/courses" className="btn-secondary">
            <Compass className="h-4 w-4" aria-hidden="true" />
            Find more courses
          </Link>
        }
      />

      <Tabs
        tabs={TABS.map((item) => ({ ...item, count: counts[item.id] }))}
        active={tab}
        onChange={(next) => {
          setTab(next);
          setPage(1);
        }}
      />

      {loading ? (
        <CardSkeletonGrid count={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : rows.length === 0 ? (
        <div className="surface-raised">
          <EmptyState
            icon={BookMarked}
            title={
              tab === 'completed'
                ? 'No completed courses yet'
                : tab === 'active'
                  ? 'Nothing in progress'
                  : 'You are not enrolled in anything yet'
            }
            description={
              tab === 'completed'
                ? 'Finish every lesson in a course and it will appear here with its certificate.'
                : 'Browse the catalogue and enrol in a course to get started. Free courses unlock straight away.'
            }
            action={
              <Link to="/courses" className="btn-primary">
                Browse the catalogue
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((row) => {
              return (
                <div key={row._id} className="relative">
                  <CourseCard
                    course={row.course}
                    progress={row.progress}
                  />

                  <div className="mt-2 flex items-center justify-between gap-2 px-1">
                    <div className="flex flex-wrap items-center gap-1.5 text-2xs text-slate-500">
                      {row.certificate && (
                        <Link
                          to="/student/certificates"
                          className="badge-amber transition-colors hover:bg-amber-500/25"
                        >
                          Certificate ready
                        </Link>
                      )}
                      <span>
                        {row.progress.completedLessons}/{row.progress.totalLessons} lessons
                      </span>
                    </div>

                    {row.status !== 'completed' && (
                      <button
                        type="button"
                        onClick={() => setTarget(row)}
                        className="flex items-center gap-1 text-2xs font-semibold text-slate-600 transition-colors hover:text-accent-rose"
                      >
                        <Trash2 className="h-3 w-3" aria-hidden="true" />
                        Withdraw
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <Pagination meta={meta} onChange={setPage} className="border-t border-ink-700/70 pt-6" />
        </>
      )}

      <ConfirmDialog
        open={Boolean(target)}
        onClose={() => setTarget(null)}
        onConfirm={unenroll}
        loading={removing}
        title="Withdraw from this course?"
        description={`This deletes your enrolment and progress for "${target?.course?.title || ''}". You can enrol again later, but your completed lessons will not come back.`}
        confirmLabel="Withdraw"
      />
    </div>
  );
}
