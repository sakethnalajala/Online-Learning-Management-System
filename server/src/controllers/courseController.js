const Course = require('../models/Course');
const Category = require('../models/Category');
const User = require('../models/User');
const Module = require('../models/Module');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const Progress = require('../models/Progress');
const Review = require('../models/Review');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok, created, paginated } = require('../utils/apiResponse');
const { getPagination } = require('../utils/pagination');
const { uniqueSlug } = require('../utils/slug');
const { dailySeries } = require('../utils/daySeries');
const { publicUrl } = require('../middleware/upload');
const { COURSE_STATUS, ROLES } = require('../config/constants');
const courseService = require('../services/courseService');
const progressService = require('../services/progressService');
const notifications = require('../services/notificationService');

const CARD_FIELDS =
  'title slug subtitle thumbnail level language isFree price discountPrice currency ' +
  'ratingAverage ratingCount enrollmentCount lessonCount moduleCount totalDurationMinutes ' +
  'status isFeatured createdAt publishedAt tags';

/** Fields an instructor may set when creating or updating a course. */
const WRITABLE = [
  'title',
  'subtitle',
  'description',
  'thumbnail',
  'promoVideoUrl',
  'category',
  'level',
  'language',
  'tags',
  'whatYouWillLearn',
  'requirements',
  'isFree',
  'price',
  'discountPrice',
  'currency',
];

const applyWritable = (course, body) => {
  for (const field of WRITABLE) {
    if (body[field] !== undefined) course[field] = body[field];
  }
  // A free course must not carry a stale price from when it was paid.
  if (course.isFree) {
    course.price = 0;
    course.discountPrice = 0;
  }
};

/* ── Public catalogue ────────────────────────────────────────────────────── */

/** GET /api/courses — published courses only, with search, filters and sort. */
const listCourses = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, { defaultLimit: 12 });

  const filter = courseService.buildCatalogueFilter(req.query);
  const sort = courseService.buildSort(req.query.sort);

  const [courses, total] = await Promise.all([
    Course.find(filter)
      .select(CARD_FIELDS)
      .populate('instructor', 'name avatar headline')
      .populate('category', 'name slug color icon')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Course.countDocuments(filter),
  ]);

  // Let a signed-in student see at a glance what they are already enrolled in.
  let enrolledIds = [];
  if (req.user && req.user.role === ROLES.STUDENT) {
    const rows = await Enrollment.find({
      student: req.user._id,
      course: { $in: courses.map((c) => c._id) },
    })
      .select('course')
      .lean();
    enrolledIds = rows.map((r) => String(r.course));
  }

  const withFlags = courses.map((course) => ({
    ...course,
    isEnrolled: enrolledIds.includes(String(course._id)),
  }));

  return paginated(res, withFlags, { page, limit, total }, 'Courses.');
});

/** GET /api/courses/featured — landing-page rail. */
const getFeatured = asyncHandler(async (req, res) => {
  const limit = Math.min(12, Number(req.query.limit) || 6);

  const courses = await Course.find({ status: COURSE_STATUS.PUBLISHED })
    .select(CARD_FIELDS)
    .populate('instructor', 'name avatar headline')
    .populate('category', 'name slug color icon')
    .sort({ isFeatured: -1, enrollmentCount: -1, ratingAverage: -1 })
    .limit(limit)
    .lean();

  return ok(res, courses, 'Featured courses.');
});

/** GET /api/courses/stats — public counters for the landing page. */
const getPublicStats = asyncHandler(async (_req, res) => {
  const [courses, students, instructors, enrollments] = await Promise.all([
    Course.countDocuments({ status: COURSE_STATUS.PUBLISHED }),
    User.countDocuments({ role: ROLES.STUDENT }),
    User.countDocuments({ role: ROLES.INSTRUCTOR }),
    Enrollment.countDocuments({ status: { $ne: 'cancelled' } }),
  ]);

  return ok(res, { courses, students, instructors, enrollments }, 'Platform stats.');
});

/**
 * GET /api/courses/:idOrSlug
 * Full detail page. The curriculum is always returned, but lesson bodies and
 * resources are withheld unless the caller has access — the outline is a
 * selling point, the content is not.
 */
const getCourse = asyncHandler(async (req, res) => {
  const { idOrSlug } = req.params;
  const byId = /^[a-f\d]{24}$/i.test(idOrSlug);

  const course = await Course.findOne(byId ? { _id: idOrSlug } : { slug: idOrSlug })
    .populate('instructor', 'name avatar headline bio expertise social website')
    .populate('category', 'name slug color icon');

  if (!course) throw ApiError.notFound('Course not found.');

  const isOwner =
    req.user && String(course.instructor._id) === String(req.user._id);
  const isAdmin = req.user?.role === ROLES.ADMIN;

  // Unpublished courses are visible only to their owner and to admins.
  if (course.status !== COURSE_STATUS.PUBLISHED && !isOwner && !isAdmin) {
    throw ApiError.notFound('Course not found.');
  }

  const modules = await Module.find({ course: course._id, ...(isOwner || isAdmin ? {} : { isPublished: true }) })
    .sort({ order: 1 })
    .lean();

  const lessons = await Lesson.find({
    course: course._id,
    ...(isOwner || isAdmin ? {} : { isPublished: true }),
  })
    .select('title summary module order durationMinutes type isPreview isPublished hasQuiz resourceCount')
    .sort({ order: 1 })
    .lean();

  const curriculum = modules.map((mod) => ({
    ...mod,
    lessons: lessons.filter((l) => String(l.module) === String(mod._id)),
  }));

  let enrollment = null;
  let progress = null;
  if (req.user) {
    enrollment = await Enrollment.findOne({ student: req.user._id, course: course._id }).lean();
    if (enrollment) {
      progress = await Progress.findOne({ enrollment: enrollment._id }).lean();
    }
  }

  const [reviewCount, instructorCourseCount] = await Promise.all([
    Review.countDocuments({ course: course._id }),
    Course.countDocuments({ instructor: course.instructor._id, status: COURSE_STATUS.PUBLISHED }),
  ]);

  return ok(
    res,
    {
      course,
      curriculum,
      enrollment,
      progress,
      isEnrolled: Boolean(enrollment),
      canEdit: Boolean(isOwner || isAdmin),
      meta: { reviewCount, instructorCourseCount },
    },
    'Course detail.'
  );
});

/* ── Instructor ──────────────────────────────────────────────────────────── */

/** GET /api/courses/instructor/mine */
const listMyCourses = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, { defaultLimit: 12 });

  const filter = { instructor: req.user._id };
  if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;
  if (req.query.search?.trim()) {
    filter.title = new RegExp(req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  }

  const [courses, total] = await Promise.all([
    Course.find(filter)
      .select(`${CARD_FIELDS} rejectionReason submittedAt reviewedAt`)
      .populate('category', 'name slug color icon')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Course.countDocuments(filter),
  ]);

  return paginated(res, courses, { page, limit, total }, 'Your courses.');
});

/** POST /api/courses */
const createCourse = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.body.category);
  if (!category || !category.isActive) {
    throw ApiError.badRequest('That category does not exist or is inactive.');
  }

  const course = new Course({ instructor: req.user._id });
  applyWritable(course, req.body);
  course.slug = await uniqueSlug(Course, course.title);
  await course.save();

  return created(res, course, 'Course created as a draft.');
});

/** PATCH /api/courses/:id */
const updateCourse = asyncHandler(async (req, res) => {
  const course = await courseService.getCourseOr404(req.params.id);
  courseService.assertCanEditCourse(course, req.user);

  if (req.body.category) {
    const category = await Category.findById(req.body.category);
    if (!category || !category.isActive) {
      throw ApiError.badRequest('That category does not exist or is inactive.');
    }
  }

  const titleChanged = req.body.title && req.body.title !== course.title;
  applyWritable(course, req.body);
  if (titleChanged) course.slug = await uniqueSlug(Course, course.title, course._id);

  await course.save();
  return ok(res, course, 'Course updated.');
});

/** POST /api/courses/:id/thumbnail */
const uploadThumbnail = asyncHandler(async (req, res) => {
  const course = await courseService.getCourseOr404(req.params.id);
  courseService.assertCanEditCourse(course, req.user);

  if (!req.file) throw ApiError.badRequest('Please attach an image file.');
  if (!req.file.mimetype.startsWith('image/')) {
    throw ApiError.badRequest('Course thumbnails must be an image file.');
  }

  course.thumbnail = publicUrl(req.file);
  await course.save();

  return ok(res, { thumbnail: course.thumbnail }, 'Thumbnail updated.');
});

/** DELETE /api/courses/:id — cascades through the whole content tree. */
const deleteCourse = asyncHandler(async (req, res) => {
  const course = await courseService.getCourseOr404(req.params.id);
  courseService.assertCanEditCourse(course, req.user);

  // Deleting a live course with students is an admin decision, not the
  // instructor's, because it destroys enrolment and certificate history.
  if (req.user.role !== ROLES.ADMIN && course.enrollmentCount > 0) {
    throw ApiError.conflict(
      `This course has ${course.enrollmentCount} enrolled student(s). Unpublish it instead, or ask an admin to remove it.`
    );
  }

  await courseService.deleteCourseCascade(course._id);
  return ok(res, null, 'Course and all of its content were deleted.');
});

/** POST /api/courses/:id/submit — instructor sends a draft for admin review. */
const submitForApproval = asyncHandler(async (req, res) => {
  const course = await courseService.getCourseOr404(req.params.id);
  courseService.assertCanEditCourse(course, req.user);

  courseService.assertStatusTransition(course, COURSE_STATUS.PENDING);
  await courseService.assertReadyForSubmission(course);

  course.status = COURSE_STATUS.PENDING;
  course.submittedAt = new Date();
  course.rejectionReason = '';
  await course.save();

  const admins = await User.find({ role: ROLES.ADMIN }).select('_id').lean();
  await notifications.onCourseSubmitted({
    adminIds: admins.map((a) => a._id),
    course,
    instructorName: req.user.name,
  });

  return ok(res, course, 'Course submitted for admin approval.');
});

/**
 * POST /api/courses/:id/publish
 * Only an approved (or previously published) course can go live, so admin
 * approval genuinely gates student availability.
 */
const publishCourse = asyncHandler(async (req, res) => {
  const course = await courseService.getCourseOr404(req.params.id);
  courseService.assertCanEditCourse(course, req.user);

  if (![COURSE_STATUS.APPROVED, COURSE_STATUS.UNPUBLISHED].includes(course.status)) {
    throw ApiError.badRequest(
      'Only an approved course can be published. Submit it for approval first.'
    );
  }

  const publishedLessons = await Lesson.countDocuments({ course: course._id, isPublished: true });
  if (publishedLessons === 0) {
    throw ApiError.badRequest('Publish at least one lesson before publishing the course.');
  }

  course.status = COURSE_STATUS.PUBLISHED;
  course.publishedAt = course.publishedAt || new Date();
  await course.save();

  return ok(res, course, 'Course is now live for students.');
});

/** POST /api/courses/:id/unpublish */
const unpublishCourse = asyncHandler(async (req, res) => {
  const course = await courseService.getCourseOr404(req.params.id);
  courseService.assertCanEditCourse(course, req.user);

  if (course.status !== COURSE_STATUS.PUBLISHED) {
    throw ApiError.badRequest('Only a published course can be unpublished.');
  }

  course.status = COURSE_STATUS.UNPUBLISHED;
  await course.save();

  return ok(res, course, 'Course unpublished. Enrolled students keep their access.');
});

/**
 * POST /api/courses/:id/announce
 * Instructor broadcast to everyone enrolled.
 */
const announce = asyncHandler(async (req, res) => {
  const course = await courseService.getCourseOr404(req.params.id);
  courseService.assertCanEditCourse(course, req.user);

  const students = await Enrollment.find({ course: course._id, status: { $ne: 'cancelled' } })
    .select('student')
    .lean();

  if (!students.length) throw ApiError.badRequest('No students are enrolled in this course yet.');

  await notifications.onInstructorUpdate({
    studentIds: students.map((s) => s.student),
    course,
    headline: req.body.title,
    body: req.body.message,
    actor: req.user._id,
  });

  return ok(res, { notified: students.length }, `Announcement sent to ${students.length} student(s).`);
});

/**
 * GET /api/courses/:id/students
 * Instructor's student-monitoring table: who enrolled, how far they got.
 */
const listCourseStudents = asyncHandler(async (req, res) => {
  const course = await courseService.getCourseOr404(req.params.id);
  courseService.assertCanEditCourse(course, req.user);

  const { page, limit, skip } = getPagination(req.query, { defaultLimit: 20 });

  const filter = { course: course._id };
  if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;

  const [enrollments, total] = await Promise.all([
    Enrollment.find(filter)
      .populate('student', 'name email avatar createdAt lastLoginAt')
      .populate('progress')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Enrollment.countDocuments(filter),
  ]);

  const rows = enrollments.map((e) => ({
    enrollmentId: e._id,
    student: e.student,
    enrolledAt: e.enrolledAt,
    status: e.status,
    paymentStatus: e.paymentStatus,
    lastAccessedAt: e.lastAccessedAt,
    percentage: e.progress?.percentage ?? 0,
    completedLessons: e.progress?.completedLessons?.length ?? 0,
    totalLessons: e.progress?.totalLessons ?? course.lessonCount,
    isCompleted: e.progress?.isCompleted ?? false,
    completedAt: e.completedAt,
  }));

  return paginated(res, rows, { page, limit, total }, 'Enrolled students.');
});

/** GET /api/courses/:id/analytics — per-course numbers for the instructor. */
const getCourseAnalytics = asyncHandler(async (req, res) => {
  const course = await courseService.getCourseOr404(req.params.id);
  courseService.assertCanEditCourse(course, req.user);

  const progressRows = await Progress.find({ course: course._id }).select('percentage isCompleted createdAt').lean();

  const buckets = { '0%': 0, '1-25%': 0, '26-50%': 0, '51-75%': 0, '76-99%': 0, '100%': 0 };
  for (const row of progressRows) {
    const p = row.percentage;
    if (p === 0) buckets['0%'] += 1;
    else if (p <= 25) buckets['1-25%'] += 1;
    else if (p <= 50) buckets['26-50%'] += 1;
    else if (p <= 75) buckets['51-75%'] += 1;
    else if (p < 100) buckets['76-99%'] += 1;
    else buckets['100%'] += 1;
  }

  // Enrolments per day for the last 30 days, zero-filled so the chart is continuous.
  const enrollmentTrend = await dailySeries(Enrollment, 30, { course: course._id });

  const ratingBreakdown = await Review.aggregate([
    { $match: { course: course._id } },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
  ]);

  return ok(res, {
    course: {
      _id: course._id,
      title: course.title,
      status: course.status,
      enrollmentCount: course.enrollmentCount,
      lessonCount: course.lessonCount,
      ratingAverage: course.ratingAverage,
      ratingCount: course.ratingCount,
    },
    completionBuckets: Object.entries(buckets).map(([label, count]) => ({ label, count })),
    averageProgress: progressRows.length
      ? Math.round(progressRows.reduce((sum, r) => sum + r.percentage, 0) / progressRows.length)
      : 0,
    completions: progressRows.filter((r) => r.isCompleted).length,
    enrollmentTrend,
    ratingBreakdown: [5, 4, 3, 2, 1].map((stars) => ({
      stars,
      count: ratingBreakdown.find((r) => r._id === stars)?.count || 0,
    })),
  });
});

/* ── Admin moderation ────────────────────────────────────────────────────── */

/** GET /api/courses/admin/all */
const adminListCourses = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, { defaultLimit: 15 });

  const filter = {};
  if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;
  if (req.query.category) filter.category = req.query.category;
  if (req.query.instructor) filter.instructor = req.query.instructor;
  if (req.query.search?.trim()) {
    filter.title = new RegExp(req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  }

  const [courses, total] = await Promise.all([
    Course.find(filter)
      .select(`${CARD_FIELDS} rejectionReason submittedAt reviewedAt`)
      .populate('instructor', 'name email avatar')
      .populate('category', 'name slug color')
      .sort({ submittedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Course.countDocuments(filter),
  ]);

  return paginated(res, courses, { page, limit, total }, 'All courses.');
});

/** POST /api/courses/:id/approve (admin) */
const approveCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id).populate('instructor', 'name');
  if (!course) throw ApiError.notFound('Course not found.');

  if (course.status !== COURSE_STATUS.PENDING) {
    throw ApiError.badRequest(`Only a pending course can be approved (this one is "${course.status}").`);
  }

  course.status = COURSE_STATUS.APPROVED;
  course.reviewedAt = new Date();
  course.reviewedBy = req.user._id;
  course.rejectionReason = '';

  // Approving is the useful action, so go live immediately unless asked not to.
  const autoPublish = req.body.publish !== false;
  if (autoPublish) {
    course.status = COURSE_STATUS.PUBLISHED;
    course.publishedAt = course.publishedAt || new Date();
  }

  await course.save();

  await notifications.onCourseApproved({ instructor: course.instructor._id, course });

  return ok(
    res,
    course,
    autoPublish ? 'Course approved and published.' : 'Course approved. The instructor can now publish it.'
  );
});

/** POST /api/courses/:id/reject (admin) */
const rejectCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id).populate('instructor', 'name');
  if (!course) throw ApiError.notFound('Course not found.');

  if (course.status === COURSE_STATUS.REJECTED) {
    throw ApiError.badRequest('This course has already been rejected.');
  }

  course.status = COURSE_STATUS.REJECTED;
  course.reviewedAt = new Date();
  course.reviewedBy = req.user._id;
  course.rejectionReason = req.body.reason;
  await course.save();

  await notifications.onCourseRejected({
    instructor: course.instructor._id,
    course,
    reason: req.body.reason,
  });

  return ok(res, course, 'Course rejected and the instructor was notified.');
});

/** PATCH /api/courses/:id/feature (admin) */
const toggleFeatured = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw ApiError.notFound('Course not found.');

  course.isFeatured = !course.isFeatured;
  await course.save();

  return ok(res, course, course.isFeatured ? 'Course featured.' : 'Course removed from featured.');
});

/** POST /api/courses/:id/resync — recompute denormalised counters. */
const resyncCourse = asyncHandler(async (req, res) => {
  const course = await courseService.getCourseOr404(req.params.id);
  courseService.assertCanEditCourse(course, req.user);

  const stats = await progressService.syncCourseStats(course._id);
  await courseService.syncCourseRating(course._id);
  await courseService.syncEnrollmentCount(course._id);
  const touched = await progressService.resyncAllProgress(course._id);

  return ok(res, { ...stats, progressRowsUpdated: touched }, 'Course statistics recalculated.');
});

module.exports = {
  listCourses,
  getFeatured,
  getPublicStats,
  getCourse,
  listMyCourses,
  createCourse,
  updateCourse,
  uploadThumbnail,
  deleteCourse,
  submitForApproval,
  publishCourse,
  unpublishCourse,
  announce,
  listCourseStudents,
  getCourseAnalytics,
  adminListCourses,
  approveCourse,
  rejectCourse,
  toggleFeatured,
  resyncCourse,
};
