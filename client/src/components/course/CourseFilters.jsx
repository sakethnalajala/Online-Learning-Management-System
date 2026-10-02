import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Button, Select } from '../ui';

const LEVELS = [
  { value: '', label: 'All levels' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'popular', label: 'Most popular' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'title', label: 'Title A–Z' },
];

const RATINGS = [
  { value: '', label: 'Any rating' },
  { value: '4', label: '4★ and up' },
  { value: '3', label: '3★ and up' },
];

/**
 * Catalogue filter bar. Search is debounced so typing does not fire a request
 * per keystroke; every other control applies immediately.
 */
export default function CourseFilters({ filters, onChange, categories = [], total }) {
  const [term, setTerm] = useState(filters.search || '');
  const [expanded, setExpanded] = useState(false);

  // Keep the field in step when filters are cleared from outside.
  useEffect(() => setTerm(filters.search || ''), [filters.search]);

  useEffect(() => {
    if (term === (filters.search || '')) return undefined;
    const timer = setTimeout(() => onChange({ search: term, page: 1 }), 400);
    return () => clearTimeout(timer);
  }, [term]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (patch) => onChange({ ...patch, page: 1 });

  const activeCount = [
    filters.category,
    filters.level,
    filters.rating,
  ].filter(Boolean).length;

  const clearAll = () => {
    setTerm('');
    onChange({ search: '', category: '', level: '', rating: '', sort: 'newest', page: 1 });
  };

  return (
    <div className="surface-raised p-4 sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            aria-hidden="true"
          />
          <input
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search courses, topics or tags…"
            aria-label="Search courses"
            className="input pl-10 pr-10"
          />
          {term && (
            <button
              type="button"
              onClick={() => setTerm('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={filters.sort || 'newest'}
            onChange={(event) => set({ sort: event.target.value })}
            aria-label="Sort courses"
            className="flex-1 lg:w-48 lg:flex-none"
          >
            {SORTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <Button
            variant="secondary"
            onClick={() => setExpanded((value) => !value)}
            className="lg:hidden"
            aria-expanded={expanded}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeCount > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-violet-600 px-1 text-2xs font-bold text-white">
                {activeCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      <div
        className={clsx(
          'grid gap-3 sm:grid-cols-2 lg:grid-cols-4',
          expanded ? 'mt-4' : 'mt-4 hidden lg:grid'
        )}
      >
        <Select
          value={filters.category || ''}
          onChange={(event) => set({ category: event.target.value })}
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category._id} value={category._id}>
              {category.name}
              {category.courseCount != null ? ` (${category.courseCount})` : ''}
            </option>
          ))}
        </Select>

        <Select
          value={filters.level || ''}
          onChange={(event) => set({ level: event.target.value })}
          aria-label="Filter by level"
        >
          {LEVELS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        <Select
          value={filters.rating || ''}
          onChange={(event) => set({ rating: event.target.value })}
          aria-label="Filter by rating"
        >
          {RATINGS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      {(activeCount > 0 || filters.search) && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-ink-700/70 pt-3.5">
          <p className="text-xs text-slate-500">
            {total != null && (
              <>
                <span className="font-bold text-white">{total}</span> course{total === 1 ? '' : 's'} match
                {total === 1 ? 'es' : ''} your filters
              </>
            )}
          </p>
          <button
            type="button"
            onClick={clearAll}
            className="flex items-center gap-1 text-xs font-semibold text-violet-300 hover:text-violet-200"
          >
            <X className="h-3.5 w-3.5" />
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
