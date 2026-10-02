/** Display helpers shared across pages. Pure functions, no side effects. */

/*
 * Every course on this platform is free, so price display is a constant.
 *
 * These three helpers are the only place the UI formats a price, which is why
 * they are kept rather than deleted: every call site across the catalogue,
 * course detail, admin and instructor pages goes through them, so returning
 * "Free" and no strike-through or discount here is what guarantees no amount
 * and no "% off" badge can appear anywhere.
 */

export const formatPrice = (course) => (course ? 'Free' : '');

/** No course carries a former price to strike through. */
export const formatOriginalPrice = () => null;

/** No course is discounted, because none is priced. */
export const discountPercent = () => null;

/** 95 -> "1h 35m", 40 -> "40m", 0 -> "—" */
export const formatDuration = (minutes) => {
  const total = Math.round(Number(minutes) || 0);
  if (total <= 0) return '—';
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (!hours) return `${mins}m`;
  if (!mins) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

export const formatHours = (minutes) => {
  const hours = (Number(minutes) || 0) / 60;
  if (hours < 1) return `${Math.round(Number(minutes) || 0)} min`;
  return `${Math.round(hours * 10) / 10} hrs`;
};

export const formatDate = (value, options = {}) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  });
};

export const formatDateTime = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/** "3 days ago", "just now". Falls back to a date beyond a month. */
export const timeAgo = (value) => {
  if (!value) return '';
  const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);

  if (seconds < 45) return 'just now';
  if (seconds < 90) return 'a minute ago';

  const units = [
    { limit: 3600, divisor: 60, name: 'minute' },
    { limit: 86400, divisor: 3600, name: 'hour' },
    { limit: 604800, divisor: 86400, name: 'day' },
    { limit: 2629800, divisor: 604800, name: 'week' },
  ];

  for (const unit of units) {
    if (seconds < unit.limit) {
      const count = Math.round(seconds / unit.divisor);
      return `${count} ${unit.name}${count === 1 ? '' : 's'} ago`;
    }
  }

  return formatDate(value);
};

/** 1250 -> "1.3k", 1_400_000 -> "1.4M" */
export const compactNumber = (value) => {
  const num = Number(value) || 0;
  if (num < 1000) return String(num);
  if (num < 1_000_000) return `${(num / 1000).toFixed(num < 10_000 ? 1 : 0).replace('.0', '')}k`;
  return `${(num / 1_000_000).toFixed(1).replace('.0', '')}M`;
};

export const initials = (name) =>
  String(name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

/**
 * Extracts a YouTube video id from any of its URL shapes so the learning
 * interface can build a privacy-friendly embed URL.
 */
export const youtubeId = (url) => {
  if (!url) return null;
  const patterns = [
    /youtube\.com\/watch\?v=([\w-]{11})/,
    /youtu\.be\/([\w-]{11})/,
    /youtube\.com\/embed\/([\w-]{11})/,
    /youtube\.com\/shorts\/([\w-]{11})/,
    /youtube\.com\/live\/([\w-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

export const youtubeEmbed = (url) => {
  const id = youtubeId(url);
  return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1` : null;
};

export const youtubeThumb = (url) => {
  const id = youtubeId(url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
};

export const formatBytes = (bytes) => {
  const value = Number(bytes) || 0;
  if (value === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(units.length - 1, Math.floor(Math.log(value) / Math.log(1024)));
  return `${(value / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

/** Visual treatment per course status, used by badges across all dashboards. */
export const COURSE_STATUS_META = {
  draft: { label: 'Draft', className: 'badge-slate', hint: 'Not submitted yet' },
  pending: { label: 'Pending review', className: 'badge-amber', hint: 'Waiting on an admin' },
  approved: { label: 'Approved', className: 'badge-cyan', hint: 'Approved — ready to publish' },
  published: { label: 'Published', className: 'badge-emerald', hint: 'Live for students' },
  unpublished: { label: 'Unpublished', className: 'badge-slate', hint: 'Hidden from the catalogue' },
  rejected: { label: 'Rejected', className: 'badge-rose', hint: 'Needs changes' },
};

export const LEVEL_META = {
  beginner: { label: 'Beginner', className: 'badge-emerald' },
  intermediate: { label: 'Intermediate', className: 'badge-amber' },
  advanced: { label: 'Advanced', className: 'badge-rose' },
};

export const RESOURCE_TYPE_META = {
  youtube: { label: 'Video', icon: 'Youtube' },
  video: { label: 'Video', icon: 'Video' },
  pdf: { label: 'PDF', icon: 'FileText' },
  document: { label: 'Document', icon: 'FileType' },
  image: { label: 'Image', icon: 'Image' },
  text: { label: 'Notes', icon: 'AlignLeft' },
  link: { label: 'Link', icon: 'ExternalLink' },
};
