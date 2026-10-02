import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { BookOpen, CheckCircle2, GraduationCap, Search, Users } from 'lucide-react';
import { courseApi } from '../../api/endpoints';
import {
  Avatar,
  Badge,
  EmptyState,
  ErrorState,
  Input,
  PageLoader,
  ProgressBar,
  Select,
  StatCard,
} from '../../components/ui';
import { PageHeader } from '../../components/layout/BackButton';
import { formatDate, timeAgo } from '../../utils/format';

/**
 * Cross-course student view. The API exposes students per course, so this page
 * gathers every course the instructor owns and merges the rows client-side.
 */
export default function InstructorStudents() {
  const [courses, setCourses] = useState([]);
  const [rowsByCourse, setRowsByCourse] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await courseApi.mine({ limit: 50 });
        if (!alive) return;
        const withStudents = res.data.filter((course) => course.enrollmentCount > 0);
        setCourses(withStudents);

        const entries = await Promise.all(
          withStudents.map(async (course) => {
            try {
              const students = await courseApi.students(course._id, { limit: 100 });
              return [course._id, students.data];
            } catch {
              return [course._id, []];
            }
          })
        );

        if (alive) setRowsByCourse(Object.fromEntries(entries));
      } catch (err) {
        if (alive) setError(err.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const allRows = useMemo(() => {
    const rows = [];
    for (const course of courses) {
      for (const row of rowsByCourse[course._id] || []) {
        rows.push({ ...row, course });
      }
    }
    return rows.sort((a, b) => new Date(b.enrolledAt) - new Date(a.enrolledAt));
  }, [courses, rowsByCourse]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return allRows.filter((row) => {
      if (courseFilter !== 'all' && String(row.course._id) !== courseFilter) return false;
      if (!term) return true;
      return (
        row.student?.name?.toLowerCase().includes(term) ||
        row.student?.email?.toLowerCase().includes(term)
      );
    });
  }, [allRows, courseFilter, search]);

  // A student enrolled in two of my courses is still one person.
  const uniqueStudents = useMemo(
    () => new Set(allRows.map((row) => String(row.student?._id))).size,
    [allRows]
  );

  if (loading) return <PageLoader label="Loading your students" />;
  if (error) return <ErrorState message={error} />;

  const completions = allRows.filter((row) => row.isCompleted).length;
  const averageProgress = allRows.length
    ? Math.round(allRows.reduce((sum, row) => sum + row.percentage, 0) / allRows.length)
    : 0;

  return (
    <div className="space-y-7">
      <PageHeader
        backTo="/instructor"
        title="Students"
        description="Everyone enrolled across all of your courses, newest first."
      />

      {allRows.length === 0 ? (
        <div className="surface-raised">
          <EmptyState
            icon={GraduationCap}
            title="No students yet"
            description="Once a published course gets its first enrolment, students will appear here with their progress."
            action={
              <Link to="/instructor/courses" className="btn-primary">
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                Manage my courses
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Enrolments" value={allRows.length} icon={Users} tone="violet" />
            <StatCard
              label="Unique students"
              value={uniqueStudents}
              icon={GraduationCap}
              tone="cyan"
              hint={`Across ${courses.length} course${courses.length === 1 ? '' : 's'}`}
            />
            <StatCard
              label="Completions"
              value={completions}
              icon={CheckCircle2}
              tone="emerald"
              hint={`${Math.round((completions / allRows.length) * 100)}% completion rate`}
            />
            <StatCard label="Average progress" value={`${averageProgress}%`} icon={Users} tone="amber" />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                aria-hidden="true"
              />
              <Input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name or email…"
                aria-label="Search students"
                className="pl-10"
              />
            </div>

            <Select
              value={courseFilter}
              onChange={(event) => setCourseFilter(event.target.value)}
              aria-label="Filter by course"
              className="sm:w-72"
            >
              <option value="all">All courses ({allRows.length})</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.title} ({course.enrollmentCount})
                </option>
              ))}
            </Select>
          </div>

          <div className="surface-raised overflow-hidden">
            {filtered.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No students match"
                description="Try a different search term or course filter."
              />
            ) : (
              <div className="table-wrap p-4 sm:p-5">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Course</th>
                      <th>Progress</th>
                      <th>Enrolled</th>
                      <th>Last active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((row) => (
                      <tr key={row.enrollmentId}>
                        <td>
                          <div className="flex items-center gap-2.5">
                            <Avatar src={row.student?.avatar} name={row.student?.name} size="sm" />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-white">{row.student?.name}</p>
                              <p className="truncate text-2xs text-slate-600">{row.student?.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="max-w-[14rem]">
                          <Link
                            to={`/instructor/courses/${row.course._id}/students`}
                            className="line-clamp-2 text-violet-300 hover:text-violet-200"
                          >
                            {row.course.title}
                          </Link>
                        </td>

                        <td className="min-w-[9rem]">
                          <ProgressBar value={row.percentage} size="sm" />
                          <p className="mt-1 flex items-center gap-2 text-2xs">
                            <span
                              className={clsx(
                                'font-bold',
                                row.isCompleted ? 'text-accent-emerald' : 'text-violet-300'
                              )}
                            >
                              {row.percentage}%
                            </span>
                            {row.isCompleted && <Badge tone="emerald">Done</Badge>}
                          </p>
                        </td>

                        <td className="whitespace-nowrap text-slate-400">{formatDate(row.enrolledAt)}</td>
                        <td className="whitespace-nowrap text-slate-400">{timeAgo(row.lastAccessedAt)}</td>
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
