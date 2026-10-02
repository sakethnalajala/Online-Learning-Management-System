const Course = require('../models/Course');
const Module = require('../models/Module');
const Lesson = require('../models/Lesson');
const Resource = require('../models/Resource');
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const Review = require('../models/Review');
const Enrollment = require('../models/Enrollment');
const Progress = require('../models/Progress');
const QuizAttempt = require('../models/QuizAttempt');
const Certificate = require('../models/Certificate');
const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');
const { COURSE_STATUS, ROLES } = require('../config/constants');

/** Loads a course or throws a 404 with a useful message. */
async function getCourseOr404(id, populate = []) {
  let query = Course.findById(id);
  for (const p of populate) query = query.populate(p.path, p.select);
  const course = await query;
  if (!course) throw ApiError.notFound('Course not found.');
  return course;
}

/**
 * Instructor-or-admin write gate for a course and everything beneath it.
 * Used by the module, lesson, resource and quiz controllers too, so ownership
 * is enforced once rather than re-derived per endpoint.
 */
function assertCanEditCourse(course, user) {
  if (user.role === ROLES.ADMIN) return;
  if (String(course.instructor?._id || course.instructor) !== String(user._id)) {
    throw ApiError.forbidden('You can only manage your own courses.');
  }
}

/** Recomputes ratingAverage / ratingCount from the review collection. */
async function syncCourseRating(courseId) {
  const [stats] = await Review.aggregate([
    { $match: { course: courseId } },
    { $group: { _id: '$course', average: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  const ratingAverage = stats ? Math.round(stats.average * 10) / 10 : 0;
  const ratingCount = stats ? stats.count : 0;

  await Course.findByIdAndUpdate(courseId, { ratingAverage, ratingCount });
  return { ratingAverage, ratingCount };
}

/** Refreshes the denormalised enrolment counter. */
async function syncEnrollmentCount(courseId) {
  const enrollmentCount = await Enrollment.countDocuments({
    course: courseId,
    status: { $ne: 'cancelled' },
  });
  await Course.findByIdAndUpdate(courseId, { enrollmentCount });
  return enrollmentCount;
}

/**
 * Removes a course and every document that hangs off it, so deleting a course
 * cannot leave orphaned lessons, attempts or certificates behind.
 */
async function deleteCourseCascade(courseId) {
  const lessons = await Lesson.find({ course: courseId }).select('_id').lean();
  const lessonIds = lessons.map((l) => l._id);
  const quizzes = await Quiz.find({ course: courseId }).select('_id').lean();
  const quizIds = quizzes.map((q) => q._id);

  await Promise.all([
    Question.deleteMany({ quiz: { $in: quizIds } }),
    Quiz.deleteMany({ course: courseId }),
    QuizAttempt.deleteMany({ course: courseId }),
    Resource.deleteMany({ course: courseId }),
    Lesson.deleteMany({ _id: { $in: lessonIds } }),
    Module.deleteMany({ course: courseId }),
    Progress.deleteMany({ course: courseId }),
    Enrollment.deleteMany({ course: courseId }),
    Review.deleteMany({ course: courseId }),
    Certificate.deleteMany({ course: courseId }),
    Notification.deleteMany({ course: courseId }),
  ]);

  await Course.findByIdAndDelete(courseId);
}

/**
 * Builds the mongo filter for the public course catalogue.
 * Students only ever see published courses; instructors/admins get scoped views
 * from their own controllers.
 */
function buildCatalogueFilter(query) {
  const filter = { status: COURSE_STATUS.PUBLISHED };

  if (query.category) filter.category = query.category;
  if (query.level) filter.level = query.level;
  if (query.instructor) filter.instructor = query.instructor;
  if (query.featured === 'true') filter.isFeatured = true;


  if (query.rating) {
    const min = Number(query.rating);
    if (!Number.isNaN(min)) filter.ratingAverage = { $gte: min };
  }

  if (query.search && query.search.trim()) {
    // Regex rather than $text so partial words match while the user types.
    const term = query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rx = new RegExp(term, 'i');
    filter.$or = [{ title: rx }, { subtitle: rx }, { description: rx }, { tags: rx }];
  }

  return filter;
}

const SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  popular: { enrollmentCount: -1, ratingAverage: -1 },
  rating: { ratingAverage: -1, ratingCount: -1 },
  title: { title: 1 },
};

const buildSort = (sort) => SORTS[sort] || SORTS.newest;

/** Guards illegal status transitions before they reach the database. */
function assertStatusTransition(course, next) {
  const { DRAFT, PENDING, APPROVED, PUBLISHED, UNPUBLISHED, REJECTED } = COURSE_STATUS;

  const allowed = {
    [DRAFT]: [PENDING],
    [PENDING]: [APPROVED, REJECTED, DRAFT],
    [APPROVED]: [PUBLISHED, UNPUBLISHED, REJECTED],
    [PUBLISHED]: [UNPUBLISHED, REJECTED],
    [UNPUBLISHED]: [PUBLISHED, REJECTED],
    [REJECTED]: [PENDING, DRAFT],
  };

  if (!allowed[course.status]?.includes(next)) {
    throw ApiError.badRequest(
      `Cannot move a course from "${course.status}" to "${next}".`
    );
  }
}

/** A course needs real content before an admin should be asked to review it. */
async function assertReadyForSubmission(course) {
  const lessonCount = await Lesson.countDocuments({ course: course._id, isPublished: true });
  if (lessonCount === 0) {
    throw ApiError.badRequest(
      'Add at least one published lesson before submitting this course for approval.'
    );
  }
  if (!course.category) throw ApiError.badRequest('Assign a category before submitting.');
  if (!course.description || course.description.length < 20) {
    throw ApiError.badRequest('Add a fuller course description before submitting.');
  }
}

module.exports = {
  getCourseOr404,
  assertCanEditCourse,
  syncCourseRating,
  syncEnrollmentCount,
  deleteCourseCascade,
  buildCatalogueFilter,
  buildSort,
  assertStatusTransition,
  assertReadyForSubmission,
};
