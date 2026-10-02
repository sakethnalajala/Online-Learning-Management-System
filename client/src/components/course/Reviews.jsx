import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { MessageSquare, Pencil, Star, Trash2 } from 'lucide-react';
import { reviewApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import {
  Avatar,
  Button,
  ConfirmDialog,
  EmptyState,
  Field,
  Modal,
  Pagination,
  Skeleton,
  StarRating,
  Textarea,
  Input,
} from '../ui';
import { timeAgo } from '../../utils/format';

/** Star distribution bars, shown beside the average. */
function RatingSummary({ summary }) {
  if (!summary) return null;

  return (
    <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
      <div className="text-center">
        <p className="font-display text-5xl font-extrabold text-white">
          {summary.average ? summary.average.toFixed(1) : '—'}
        </p>
        <StarRating value={summary.average} size="md" className="mt-2 justify-center" />
        <p className="mt-1.5 text-xs text-slate-500">
          {summary.total} review{summary.total === 1 ? '' : 's'}
        </p>
      </div>

      <div className="space-y-1.5">
        {summary.breakdown.map((row) => (
          <div key={row.stars} className="flex items-center gap-2.5 text-xs">
            <span className="flex w-9 shrink-0 items-center gap-0.5 text-slate-400">
              {row.stars}
              <Star className="h-3 w-3 fill-accent-amber text-accent-amber" aria-hidden="true" />
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-700">
              <div
                className="h-full rounded-full bg-accent-amber transition-all duration-700 ease-premium"
                style={{ width: `${row.percentage}%` }}
              />
            </div>
            <span className="w-8 shrink-0 text-right tabular-nums text-slate-500">{row.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Review list plus the write/edit/delete flow.
 * `canReview` is decided by the parent from the enrolment state; the API
 * enforces the same rule, so a stale UI cannot post an invalid review.
 */
export default function Reviews({ courseId, canReview = false, onRatingChange }) {
  const { user, isStudent } = useAuth();

  const [reviews, setReviews] = useState([]);
  const [meta, setMeta] = useState(null);
  const [summary, setSummary] = useState(null);
  const [myReview, setMyReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState({ rating: 5, title: '', comment: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const load = async (targetPage = page) => {
    setLoading(true);
    try {
      const [list, stats] = await Promise.all([
        reviewApi.listForCourse(courseId, { page: targetPage, limit: 5 }),
        reviewApi.summary(courseId),
      ]);
      setReviews(list.data);
      setMeta(list.meta);
      setSummary(stats);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(page);
  }, [courseId, page]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load the viewer's own review separately so it can be edited from anywhere
  // in the list, including pages it does not appear on.
  useEffect(() => {
    if (!isStudent) return;
    reviewApi
      .mineForCourse(courseId)
      .then((data) => {
        setMyReview(data);
        if (data) setForm({ rating: data.rating, title: data.title || '', comment: data.comment || '' });
      })
      .catch(() => setMyReview(null));
  }, [courseId, isStudent]);

  const submit = async (event) => {
    event.preventDefault();
    setErrors({});
    setSaving(true);

    try {
      const saved = myReview
        ? await reviewApi.update(myReview._id, form)
        : await reviewApi.create(courseId, form);

      setMyReview(saved);
      setEditorOpen(false);
      toast.success(myReview ? 'Review updated.' : 'Thanks for your review.');
      await load(1);
      setPage(1);
      onRatingChange?.();
    } catch (error) {
      setErrors(error.errors || {});
      if (!error.errors) toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await reviewApi.remove(myReview._id);
      setMyReview(null);
      setForm({ rating: 5, title: '', comment: '' });
      setConfirmOpen(false);
      toast.success('Your review was deleted.');
      await load(1);
      setPage(1);
      onRatingChange?.();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {summary?.total > 0 && (
        <div className="surface p-5 sm:p-6">
          <RatingSummary summary={summary} />
        </div>
      )}

      {isStudent && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-400">
            {myReview
              ? 'You have reviewed this course.'
              : canReview
                ? 'Share what you thought of this course.'
                : 'Enrol in this course to leave a review.'}
          </p>
          {myReview ? (
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" icon={Pencil} onClick={() => setEditorOpen(true)}>
                Edit review
              </Button>
              <Button variant="danger" size="sm" icon={Trash2} onClick={() => setConfirmOpen(true)}>
                Delete
              </Button>
            </div>
          ) : (
            canReview && (
              <Button size="sm" icon={Star} onClick={() => setEditorOpen(true)}>
                Write a review
              </Button>
            )
          )}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((index) => (
            <div key={index} className="surface space-y-3 p-5">
              <div className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No reviews yet"
          description="Be the first to share your experience with this course."
        />
      ) : (
        <ul className="space-y-4">
          {reviews.map((review) => (
            <li key={review._id} className="surface p-5">
              <div className="flex items-start gap-3">
                <Avatar src={review.student?.avatar} name={review.student?.name} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-white">{review.student?.name || 'Student'}</p>
                    {String(review.student?._id) === String(user?._id) && (
                      <span className="badge-violet">You</span>
                    )}
                  </div>
                  {review.student?.headline && (
                    <p className="truncate text-xs text-slate-500">{review.student.headline}</p>
                  )}
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <StarRating value={review.rating} size="sm" />
                    <span className="text-xs text-slate-600">
                      {timeAgo(review.createdAt)}
                      {review.isEdited && ' · edited'}
                    </span>
                  </div>
                </div>
              </div>

              {review.title && <p className="mt-3.5 font-semibold text-white">{review.title}</p>}
              {review.comment && (
                <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-slate-300">
                  {review.comment}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      <Pagination meta={meta} onChange={setPage} />

      <Modal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={myReview ? 'Edit your review' : 'Write a review'}
        description="Your name and rating will be visible to other students."
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditorOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={submit} loading={saving}>
              {myReview ? 'Save changes' : 'Publish review'}
            </Button>
          </>
        }
      >
        <form onSubmit={submit} className="space-y-4">
          <Field label="Your rating" required error={errors.rating}>
            <div className="flex items-center gap-3">
              <StarRating
                value={form.rating}
                size="lg"
                interactive
                onChange={(rating) => setForm({ ...form, rating })}
              />
              <span className="text-sm font-semibold text-slate-400">{form.rating} of 5</span>
            </div>
          </Field>

          <Field label="Headline" hint="Optional — a short summary" error={errors.title}>
            <Input
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              placeholder="e.g. Clear explanations, genuinely useful"
              maxLength={120}
              error={errors.title}
            />
          </Field>

          <Field
            label="Your review"
            hint={`${form.comment.length}/2000 characters`}
            error={errors.comment}
          >
            <Textarea
              value={form.comment}
              onChange={(event) => setForm({ ...form, comment: event.target.value })}
              placeholder="What worked for you? What could be better? Be specific — it helps other students more than a rating alone."
              rows={6}
              maxLength={2000}
              error={errors.comment}
            />
          </Field>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={remove}
        loading={deleting}
        title="Delete your review?"
        description="This removes your rating and comment from the course. You can write a new review afterwards."
        confirmLabel="Delete review"
      />
    </div>
  );
}
