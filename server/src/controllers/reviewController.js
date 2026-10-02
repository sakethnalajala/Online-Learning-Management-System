const Review = require('../models/Review');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok, created, paginated } = require('../utils/apiResponse');
const { getPagination } = require('../utils/pagination');
const courseService = require('../services/courseService');
const notifications = require('../services/notificationService');

/**
 * GET /api/courses/:courseId/reviews
 * Public, paginated, with the star breakdown the detail page renders.
 */
const listCourseReviews = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, { defaultLimit: 10 });

  const filter = { course: req.params.courseId };
  if (req.query.rating) filter.rating = Number(req.query.rating);

  const sort =
    req.query.sort === 'highest'
      ? { rating: -1, createdAt: -1 }
      : req.query.sort === 'lowest'
        ? { rating: 1, createdAt: -1 }
        : { createdAt: -1 };

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('student', 'name avatar headline')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments(filter),
  ]);

  // Flag the caller's own review so the UI can offer Edit instead of Write.
  const rows = reviews.map((review) => ({
    ...review,
    isMine: Boolean(req.user && String(review.student?._id) === String(req.user._id)),
  }));

  return paginated(res, rows, { page, limit, total }, 'Course reviews.');
});

/** GET /api/courses/:courseId/reviews/summary */
const getReviewSummary = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.courseId).select('ratingAverage ratingCount').lean();
  if (!course) throw ApiError.notFound('Course not found.');

  const breakdown = await Review.aggregate([
    { $match: { course: course._id } },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
  ]);

  const counts = [5, 4, 3, 2, 1].map((stars) => {
    const count = breakdown.find((b) => b._id === stars)?.count || 0;
    return {
      stars,
      count,
      percentage: course.ratingCount ? Math.round((count / course.ratingCount) * 100) : 0,
    };
  });

  return ok(
    res,
    { average: course.ratingAverage, total: course.ratingCount, breakdown: counts },
    'Rating summary.'
  );
});

/**
 * POST /api/courses/:courseId/reviews
 * Business rules: only enrolled students may review, and only once per course.
 */
const createReview = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.courseId).populate('instructor', 'name');
  if (!course) throw ApiError.notFound('Course not found.');

  const enrolled = await Enrollment.exists({ student: req.user._id, course: course._id });
  if (!enrolled) {
    throw ApiError.forbidden('Only students enrolled in this course can review it.');
  }

  if (await Review.exists({ student: req.user._id, course: course._id })) {
    throw ApiError.conflict('You have already reviewed this course. Edit your review instead.');
  }

  let review;
  try {
    review = await Review.create({
      course: course._id,
      student: req.user._id,
      rating: req.body.rating,
      title: req.body.title || '',
      comment: req.body.comment || '',
    });
  } catch (err) {
    if (err.code === 11000) {
      throw ApiError.conflict('You have already reviewed this course.');
    }
    throw err;
  }

  await courseService.syncCourseRating(course._id);
  await notifications.onNewReview({
    instructor: course.instructor._id,
    course,
    rating: review.rating,
    actor: req.user._id,
  });

  await review.populate('student', 'name avatar headline');
  return created(res, review, 'Thanks for your review.');
});

/** GET /api/reviews/me — the signed-in student's own reviews. */
const listMyReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ student: req.user._id })
    .populate('course', 'title slug thumbnail')
    .sort({ createdAt: -1 })
    .lean();

  return ok(res, reviews, 'Your reviews.');
});

/** GET /api/reviews/me/course/:courseId */
const getMyReviewForCourse = asyncHandler(async (req, res) => {
  const review = await Review.findOne({
    student: req.user._id,
    course: req.params.courseId,
  }).lean();

  return ok(res, review, review ? 'Your review.' : 'You have not reviewed this course.');
});

/**
 * PATCH /api/reviews/:id
 * A student may only ever modify their own review; admins may not rewrite it.
 */
const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw ApiError.notFound('Review not found.');

  if (String(review.student) !== String(req.user._id)) {
    throw ApiError.forbidden('You can only edit your own review.');
  }

  if (req.body.rating !== undefined) review.rating = req.body.rating;
  if (req.body.title !== undefined) review.title = req.body.title;
  if (req.body.comment !== undefined) review.comment = req.body.comment;
  review.isEdited = true;

  await review.save();
  await courseService.syncCourseRating(review.course);

  await review.populate('student', 'name avatar headline');
  return ok(res, review, 'Review updated.');
});

/**
 * DELETE /api/reviews/:id
 * The author can delete their own; an admin can remove any as moderation.
 */
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw ApiError.notFound('Review not found.');

  const isAuthor = String(review.student) === String(req.user._id);
  if (!isAuthor && req.user.role !== 'admin') {
    throw ApiError.forbidden('You can only delete your own review.');
  }

  const courseId = review.course;
  await review.deleteOne();
  await courseService.syncCourseRating(courseId);

  return ok(res, null, isAuthor ? 'Your review was deleted.' : 'Review removed.');
});

module.exports = {
  listCourseReviews,
  getReviewSummary,
  createReview,
  listMyReviews,
  getMyReviewForCourse,
  updateReview,
  deleteReview,
};
