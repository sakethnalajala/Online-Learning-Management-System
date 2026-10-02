import { useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { BookOpen, CheckCircle2, Clock, PlayCircle, Users } from 'lucide-react';
import { Avatar, Badge, ProgressBar, StarRating } from '../ui';
import { assetUrl } from '../../api/client';
import {
  COURSE_STATUS_META,
  LEVEL_META,
  compactNumber,
  discountPercent,
  formatDuration,
  formatOriginalPrice,
  formatPrice,
  youtubeThumb,
} from '../../utils/format';

/**
 * Falls back to the promo video's YouTube still when no thumbnail was set, and
 * to a branded placeholder if the image URL turns out to be dead — a broken
 * image icon in a card grid looks worse than no image at all.
 */
function Thumbnail({ course, className }) {
  const src = assetUrl(course.thumbnail) || youtubeThumb(course.promoVideoUrl);
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={clsx(
          'grid place-items-center bg-gradient-to-br from-violet-900/50 via-ink-800 to-ink-850',
          className
        )}
      >
        <BookOpen className="h-8 w-8 text-violet-500/60" aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className={clsx('object-cover transition-transform duration-500 group-hover:scale-105', className)}
    />
  );
}

/**
 * The catalogue card. `progress` switches it into "my courses" mode, showing a
 * progress bar and a Continue action instead of the price.
 */
export default function CourseCard({ course, progress, to, showStatus = false, footer }) {
  if (!course) return null;

  const level = LEVEL_META[course.level] || LEVEL_META.beginner;
  const status = COURSE_STATUS_META[course.status];
  const discount = discountPercent(course);
  const original = formatOriginalPrice(course);
  const href = to || `/courses/${course.slug || course._id}`;
  const isLearning = Boolean(progress);
  const done = progress?.isCompleted || progress?.percentage === 100;

  return (
    <article className="surface-interactive group flex flex-col overflow-hidden">
      <Link to={href} className="relative block aspect-video overflow-hidden bg-ink-800">
        <Thumbnail course={course} className="h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/75 via-transparent to-transparent" />

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {course.category?.name && (
            <span
              className="badge bg-ink-950/75 text-white backdrop-blur-sm"
              style={{ boxShadow: `inset 0 0 0 1px ${course.category.color || '#8b5cf6'}55` }}
            >
              {course.category.name}
            </span>
          )}
          {course.isFeatured && <Badge tone="amber">Featured</Badge>}
        </div>

        <div className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
          {showStatus && status && <span className={status.className}>{status.label}</span>}
          {done && <Badge tone="emerald" icon={CheckCircle2}>Completed</Badge>}
        </div>

        {isLearning && (
          <div className="absolute inset-x-0 bottom-0 p-3">
            <ProgressBar value={progress.percentage} size="sm" />
          </div>
        )}

        {!isLearning && course.isEnrolled && (
          <span className="absolute bottom-3 left-3">
            <Badge tone="violet" icon={CheckCircle2}>Enrolled</Badge>
          </span>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col p-5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className={level.className}>{level.label}</span>
          {course.isFree ? (
            <Badge tone="emerald">Free</Badge>
          ) : (
            discount && <Badge tone="rose">{discount}% off</Badge>
          )}
        </div>

        <h3 className="mb-1.5 text-base leading-snug">
          <Link to={href} className="line-clamp-2 transition-colors hover:text-violet-300">
            {course.title}
          </Link>
        </h3>

        {course.subtitle && (
          <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-slate-400">{course.subtitle}</p>
        )}

        {course.instructor?.name && (
          <Link
            to={`/instructors/${course.instructor._id}`}
            className="mb-3 flex items-center gap-2 text-xs text-slate-500 transition-colors hover:text-slate-300"
          >
            <Avatar src={course.instructor.avatar} name={course.instructor.name} size="xs" />
            <span className="truncate">{course.instructor.name}</span>
          </Link>
        )}

        <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" />
            {course.lessonCount || 0} lessons
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {formatDuration(course.totalDurationMinutes)}
          </span>
          {course.enrollmentCount > 0 && (
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
              {compactNumber(course.enrollmentCount)}
            </span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-ink-700/70 pt-3.5">
          {course.ratingCount > 0 ? (
            <StarRating value={course.ratingAverage} count={course.ratingCount} size="sm" />
          ) : (
            <span className="text-xs text-slate-600">No ratings yet</span>
          )}

          {footer ||
            (isLearning ? (
              <Link to={`/learn/${course._id}`} className="btn-primary btn-sm">
                {done ? 'Review' : progress.percentage > 0 ? 'Continue' : 'Start'}
              </Link>
            ) : (
              <div className="text-right">
                <span
                  className={clsx(
                    'font-display text-base font-bold',
                    course.isFree ? 'text-accent-emerald' : 'text-white'
                  )}
                >
                  {formatPrice(course)}
                </span>
                {original && (
                  <span className="ml-1.5 text-xs text-slate-600 line-through">{original}</span>
                )}
              </div>
            ))}
        </div>
      </div>
    </article>
  );
}
