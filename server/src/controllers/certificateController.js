const Certificate = require('../models/Certificate');
const Progress = require('../models/Progress');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok, paginated } = require('../utils/apiResponse');
const { getPagination } = require('../utils/pagination');
const certificateService = require('../services/certificateService');

/** GET /api/certificates/me */
const listMyCertificates = asyncHandler(async (req, res) => {
  const certificates = await Certificate.find({ student: req.user._id, isRevoked: false })
    .populate({
      path: 'course',
      select: 'title slug thumbnail level totalDurationMinutes lessonCount',
      populate: { path: 'category', select: 'name color' },
    })
    .populate('instructor', 'name avatar')
    .sort({ issuedAt: -1 })
    .lean();

  return ok(res, certificates, 'Your certificates.');
});

/**
 * GET /api/certificates/:id
 * The renderable certificate. Readable by its owner, the course instructor and
 * admins; anyone else must use the public verification endpoint.
 */
const getCertificate = asyncHandler(async (req, res) => {
  const certificate = await Certificate.findById(req.params.id)
    .populate({
      path: 'course',
      select: 'title slug thumbnail level totalDurationMinutes lessonCount',
      populate: { path: 'category', select: 'name color' },
    })
    .populate('student', 'name email avatar')
    .populate('instructor', 'name avatar headline')
    .lean();

  if (!certificate) throw ApiError.notFound('Certificate not found.');

  const isOwner = String(certificate.student._id) === String(req.user._id);
  const isInstructor = String(certificate.instructor?._id) === String(req.user._id);

  if (!isOwner && !isInstructor && req.user.role !== 'admin') {
    throw ApiError.forbidden('You do not have access to this certificate.');
  }

  return ok(res, certificate, 'Certificate.');
});

/**
 * GET /api/certificates/verify/:code
 * Public: confirms a certificate is genuine without exposing contact details.
 * Accepts either the printed certificate id or the long verification code.
 */
const verifyCertificate = asyncHandler(async (req, res) => {
  const { code } = req.params;

  const certificate = await Certificate.findOne({
    $or: [{ verificationCode: code }, { certificateId: code.toUpperCase() }],
  })
    .populate('course', 'title slug totalDurationMinutes')
    .lean();

  if (!certificate || certificate.isRevoked) {
    return ok(res, { valid: false }, 'No valid certificate matches that code.');
  }

  return ok(
    res,
    {
      valid: true,
      certificateId: certificate.certificateId,
      studentName: certificate.studentName,
      courseTitle: certificate.courseTitle,
      instructorName: certificate.instructorName,
      issuedAt: certificate.issuedAt,
      totalLessons: certificate.totalLessons,
      hoursOfContent: certificate.hoursOfContent,
    },
    'Certificate verified.'
  );
});

/**
 * POST /api/certificates/course/:courseId/claim
 * Idempotent safety net: if a student is at 100% but has no certificate row
 * (e.g. progress was recalculated by an admin), this issues it on demand.
 */
const claimCertificate = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.courseId).populate('instructor', 'name');
  if (!course) throw ApiError.notFound('Course not found.');

  const enrollment = await Enrollment.findOne({ student: req.user._id, course: course._id });
  if (!enrollment) throw ApiError.forbidden('You are not enrolled in this course.');

  const progress = await Progress.findOne({ enrollment: enrollment._id });
  if (!progress) throw ApiError.notFound('No progress record found for this enrolment.');

  if (progress.percentage < 100) {
    throw ApiError.badRequest(
      `Complete the course to claim your certificate — you are at ${progress.percentage}%.`
    );
  }

  const student = await User.findById(req.user._id);
  const { certificate, created: wasCreated } = await certificateService.issueCertificate({
    student,
    course,
    enrollment,
    progress,
  });

  if (!enrollment.certificate) {
    enrollment.certificate = certificate._id;
    enrollment.status = 'completed';
    enrollment.completedAt = enrollment.completedAt || progress.completedAt || new Date();
    await enrollment.save();
  }

  return ok(
    res,
    certificate,
    wasCreated ? 'Certificate issued.' : 'You already have a certificate for this course.'
  );
});

/** GET /api/certificates (admin) */
const adminListCertificates = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, { defaultLimit: 20 });

  const filter = {};
  if (req.query.course) filter.course = req.query.course;
  if (req.query.student) filter.student = req.query.student;

  const [certificates, total] = await Promise.all([
    Certificate.find(filter)
      .populate('course', 'title slug')
      .populate('student', 'name email')
      .sort({ issuedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Certificate.countDocuments(filter),
  ]);

  return paginated(res, certificates, { page, limit, total }, 'Issued certificates.');
});

/** GET /api/certificates/instructor/issued — certificates for my courses. */
const listIssuedByMyCourses = asyncHandler(async (req, res) => {
  const certificates = await Certificate.find({ instructor: req.user._id })
    .populate('course', 'title slug thumbnail')
    .populate('student', 'name email avatar')
    .sort({ issuedAt: -1 })
    .lean();

  return ok(res, certificates, 'Certificates issued for your courses.');
});

module.exports = {
  listMyCertificates,
  getCertificate,
  verifyCertificate,
  claimCertificate,
  adminListCertificates,
  listIssuedByMyCourses,
};
