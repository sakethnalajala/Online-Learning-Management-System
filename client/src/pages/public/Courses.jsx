import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import { categoryApi, courseApi } from '../../api/endpoints';
import CourseCard from '../../components/course/CourseCard';
import CourseFilters from '../../components/course/CourseFilters';
import {
  Button,
  CardSkeletonGrid,
  EmptyState,
  ErrorState,
  Pagination,
} from '../../components/ui';
import { PageHeader } from '../../components/layout/BackButton';

const DEFAULTS = { search: '', category: '', level: '', rating: '', sort: 'newest', page: 1 };

/** Keeps filters in the URL so a filtered catalogue is shareable and survives reload. */
function useFilterParams() {
  const [params, setParams] = useSearchParams();

  const filters = useMemo(
    () => ({
      search: params.get('search') || '',
      category: params.get('category') || '',
      level: params.get('level') || '',
      rating: params.get('rating') || '',
      sort: params.get('sort') || 'newest',
      page: Number(params.get('page')) || 1,
    }),
    [params]
  );

  const update = useCallback(
    (patch) => {
      const next = { ...filters, ...patch };
      const clean = {};
      for (const [key, value] of Object.entries(next)) {
        // Only non-default values reach the URL, so links stay readable.
        if (value && String(value) !== String(DEFAULTS[key])) clean[key] = String(value);
      }
      setParams(clean, { replace: true });
    },
    [filters, setParams]
  );

  return [filters, update];
}

export default function Courses() {
  const [filters, updateFilters] = useFilterParams();

  const [courses, setCourses] = useState([]);
  const [meta, setMeta] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    categoryApi
      .list({ withCounts: true })
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    const query = { page: filters.page, limit: 12, sort: filters.sort };
    if (filters.search) query.search = filters.search;
    if (filters.category) query.category = filters.category;
    if (filters.level) query.level = filters.level;
    if (filters.rating) query.rating = filters.rating;

    try {
      const res = await courseApi.list(query);
      setCourses(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(err.message);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  const activeCategory = categories.find((category) => category._id === filters.category);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        backTo="/"
        eyebrow="Catalogue"
        title={activeCategory ? activeCategory.name : 'All courses'}
        description={
          activeCategory?.description ||
          'Every course here has been reviewed and published, and every one is free. Filter by category, level or rating.'
        }
      />

      <div className="mt-8">
        <CourseFilters
          filters={filters}
          onChange={updateFilters}
          categories={categories}
          total={meta?.total}
        />
      </div>

      <div className="mt-8">
        {loading ? (
          <CardSkeletonGrid count={9} />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : courses.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No courses match those filters"
            description="Try a broader search term, or clear the filters to see the whole catalogue."
            action={
              <Button variant="secondary" onClick={() => updateFilters(DEFAULTS)}>
                Clear all filters
              </Button>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {courses.map((course) => (
                <CourseCard key={course._id} course={course} />
              ))}
            </div>
            <Pagination
              meta={meta}
              onChange={(page) => updateFilters({ page })}
              className="mt-10 border-t border-ink-700/70 pt-6"
            />
          </>
        )}
      </div>
    </div>
  );
}
