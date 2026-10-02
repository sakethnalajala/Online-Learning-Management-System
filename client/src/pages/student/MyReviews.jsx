import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MessageSquare, Pencil, Star, Trash2 } from 'lucide-react';
import { reviewApi } from '../../api/endpoints';
import { assetUrl } from '../../api/client';
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  Input,
  Modal,
  Skeleton,
  StarRating,
  Textarea,
} from '../../components/ui';
import { PageHeader } from '../../components/layout/BackButton';
import { timeAgo } from '../../utils/format';

export default function MyReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ rating: 5, title: '', comment: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [target, setTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setReviews(await reviewApi.mine());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openEditor = (review) => {
    setEditing(review);
    setForm({ rating: review.rating, title: review.title || '', comment: review.comment || '' });
    setErrors({});
  };

  const save = async (event) => {
    event?.preventDefault();
    setErrors({});
    setSaving(true);
    try {
      await reviewApi.update(editing._id, form);
      toast.success('Review updated.');
      setEditing(null);
      await load();
    } catch (err) {
      setErrors(err.errors || {});
      if (!err.errors) toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await reviewApi.remove(target._id);
      toast.success('Review deleted.');
      setTarget(null);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-7">
      <PageHeader
        backTo="/student"
        title="My reviews"
        description="Reviews you have written. You can edit or delete your own review at any time."
      />

      {loading ? (
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : reviews.length === 0 ? (
        <div className="surface-raised">
          <EmptyState
            icon={MessageSquare}
            title="You have not reviewed anything yet"
            description="Once you are enrolled in a course you can rate it and leave a review from its course page."
            action={
              <Link to="/student/courses" className="btn-primary">
                Go to my courses
              </Link>
            }
          />
        </div>
      ) : (
        <ul className="space-y-4">
          {reviews.map((review) => (
            <li key={review._id} className="surface-raised p-5">
              <div className="flex flex-wrap items-start gap-4">
                {review.course && (
                  <Link
                    to={`/courses/${review.course.slug || review.course._id}`}
                    className="h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-ink-800"
                  >
                    {assetUrl(review.course.thumbnail) ? (
                      <img
                        src={assetUrl(review.course.thumbnail)}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="grid h-full place-items-center bg-gradient-to-br from-violet-900/50 to-ink-850">
                        <Star className="h-4 w-4 text-violet-500/60" aria-hidden="true" />
                      </span>
                    )}
                  </Link>
                )}

                <div className="min-w-0 flex-1">
                  {review.course && (
                    <Link
                      to={`/courses/${review.course.slug || review.course._id}`}
                      className="line-clamp-1 text-sm font-bold text-white transition-colors hover:text-violet-300"
                    >
                      {review.course.title}
                    </Link>
                  )}
                  <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
                    <StarRating value={review.rating} size="sm" />
                    <span className="text-xs text-slate-600">
                      {timeAgo(review.createdAt)}
                      {review.isEdited && ' · edited'}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 gap-2">
                  <Button variant="secondary" size="sm" icon={Pencil} onClick={() => openEditor(review)}>
                    Edit
                  </Button>
                  <Button variant="danger" size="sm" icon={Trash2} onClick={() => setTarget(review)}>
                    Delete
                  </Button>
                </div>
              </div>

              {review.title && <p className="mt-4 font-semibold text-white">{review.title}</p>}
              {review.comment && (
                <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-slate-300">
                  {review.comment}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Edit your review"
        description={editing?.course?.title}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving}>
              Save changes
            </Button>
          </>
        }
      >
        <form onSubmit={save} className="space-y-4">
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

          <Field label="Headline" hint="Optional" error={errors.title}>
            <Input
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              maxLength={120}
              error={errors.title}
            />
          </Field>

          <Field label="Your review" hint={`${form.comment.length}/2000`} error={errors.comment}>
            <Textarea
              value={form.comment}
              onChange={(event) => setForm({ ...form, comment: event.target.value })}
              rows={6}
              maxLength={2000}
              error={errors.comment}
            />
          </Field>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(target)}
        onClose={() => setTarget(null)}
        onConfirm={remove}
        loading={deleting}
        title="Delete this review?"
        description={`Your rating and comment for "${target?.course?.title || 'this course'}" will be removed, and the course average will be recalculated.`}
        confirmLabel="Delete review"
      />
    </div>
  );
}
