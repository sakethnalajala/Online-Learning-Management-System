const Enrollment = require('../models/Enrollment');
const Progress = require('../models/Progress');
const Course = require('../models/Course');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok, created, paginated } = require('../utils/apiResponse');
const { getPagination } = require('../utils/pagination');
const enrollmentService = require('../services/enrollmentService');
const courseService = require('../services/courseService');

/**
 * POST /api/enrollments
 * Body: { courseId }
 * Duplicate enrolment is rejected with 409 by both the service check and the
 * unique index behind it.
 */
const enroll = asyncHandler(async (req, res) => {
  const courseId = req.body.courseId || req.body.course;
  if (!courseId || !/^[a-f\d]{24}$/i.test(String(courseId))) {
    throw ApiError.badRequest('A valid courseId is required.');
  }

  const course = await Course.findById(courseId).populate('instructor', 'name');
  if (!course) throw ApiError.notFound('Course not found.');

  const { enrollment, progress, requiresPayment } = await enrollmentService.enroll({
    student: req.user,
    course,
  });

  return created(
    res,
    { enrollment, progress, requiresPayment },
    requiresPayment
      ? 'Enrolment recorded. This is a paid course, so content unlocks once payment is completed.'
      : `You are enrolled in "${course.title}". Happy learning!`
  );
});

/**
 * GET /api/enrollments/me
 * The "My Courses" list, with live progress attached to each row.
 */
const listMyEnrollments = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, { defaultLimit: 12 });

  const filter = { student: req.user._id };
  if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;

  const [enrollments, total] = await Promise.all([
    Enrollment.find(filter)
      .populate({
        path: 'course',
        select:
          'title slug subtitle thumbnail level lessonCount moduleCount totalDurationMinutes ratingAverage ratingCount status isFree price',
        populate: [
          { path: 'instructor', select: 'name avatar' },
          { path: 'category', select: 'name slug color' },
        ],
      })
      .populate('progress')
      .populate('certificate', 'certificateId issuedAt')
      .sort({ lastAccessedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Enrollment.countDocuments(filter),
  ]);

  // A course deleted by an admin leaves a dangling row; drop it from the view.
  const rows = enrollments
    .filter((e) => e.course)
    .map((e) => ({
      _id: e._id,
      course: e.course,
      status: e.status,
      paymentStatus: e.paymentStatus,
      accessType: e.accessType,
      enrolledAt: e.enrolledAt,
      lastAccessedAt: e.lastAccessedAt,
      completedAt: e.completedAt,
      certificate: e.certificate,
      progress: {
        percentage: e.progress?.percentage ?? 0,
        completedLessons: e.progress?.completedLessons?.length ?? 0,
        totalLessons: e.progress?.totalLessons ?? e.course.lessonCount ?? 0,
        isCompleted: e.progress?.isCompleted ?? false,
        lastLesson: e.progress?.lastLesson ?? null,
        lastModule: e.progress?.lastModule ?? null,
      },
    }));

  return paginated(res, rows, { page, limit, total }, 'Your enrolments.');
});

/** GET /api/enrollments/me/course/:courseId — is this student enrolled? */
const getMyEnrollmentForCourse = asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findOne({
    student: req.user._id,
    course: req.params.courseId,
  })
    .populate('progress')
    .populate('certificate', 'certificateId issuedAt')
    .lean();

  if (!enrollment) return ok(res, { isEnrolled: false, enrollment: null }, 'Not enrolled.');

  return ok(res, { isEnrolled: true, enrollment }, 'Enrolment found.');
});

/** DELETE /api/enrollments/:id — a student may withdraw from a course. */
const unenroll = asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findById(req.params.id);
  if (!enrollment) throw ApiError.notFound('Enrolment not found.');

  if (String(enrollment.student) !== String(req.user._id) && req.user.role !== 'admin') {
    throw ApiError.forbidden('You can only withdraw from your own enrolments.');
  }

  if (enrollment.status === 'completed') {
    throw ApiError.badRequest(
      'You have completed this course. Its record and certificate are kept permanently.'
    );
  }

  const courseId = enrollment.course;
  await Progress.deleteOne({ enrollment: enrollment._id });
  await enrollment.deleteOne();
  await courseService.syncEnrollmentCount(courseId);

  return ok(res, null, 'You have been withdrawn from this course.');
});

/* ── Admin ───────────────────────────────────────────────────────────────── */

/** GET /api/enrollments (admin) — platform-wide enrolment monitoring. */
const adminListEnrollments = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, { defaultLimit: 20 });

  const filter = {};
  if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;
  if (req.query.course) filter.course = req.query.course;
  if (req.query.student) filter.student = req.query.student;
  if (req.query.paymentStatus && req.query.paymentStatus !== 'all') {
    filter.paymentStatus = req.query.paymentStatus;
  }

  const [enrollments, total] = await Promise.all([
    Enrollment.find(filter)
      .populate('student', 'name email avatar')
      .populate('course', 'title slug thumbnail isFree price')
      .populate('instructor', 'name email')
      .populate('progress')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Enrollment.countDocuments(filter),
  ]);

  const rows = enrollments.map((e) => ({
    ...e,
    percentage: e.progress?.percentage ?? 0,
  }));

  return paginated(res, rows, { page, limit, total }, 'Platform enrolments.');
});

/**
 * PATCH /api/enrollments/:id/access (admin)
 * Waives payment on a paid course so the student can actually learn. This is
 * the honest stand-in for a checkout flow: access is *granted*, not "paid".
 */
const grantAccess = asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findById(req.params.id).populate('course', 'title');
  if (!enrollment) throw ApiError.notFound('Enrolment not found.');

  if (enrollment.paymentStatus !== 'pending_payment') {
    throw ApiError.badRequest('This enrolment does not have a pending payment.');
  }

  enrollment.paymentStatus = 'waived';
  enrollment.accessType = 'granted';
  await enrollment.save();

  return ok(res, enrollment, `Access granted for "${enrollment.course.title}".`);
});

module.exports = {
  enroll,
  listMyEnrollments,
  getMyEnrollmentForCourse,
  unenroll,
  adminListEnrollments,
  grantAccess,
};
