const Enrollment = require('../models/Enrollment');
const Progress = require('../models/Progress');
const ApiError = require('../utils/ApiError');
const { COURSE_STATUS } = require('../config/constants');
const progressService = require('./progressService');
const notifications = require('./notificationService');
const courseService = require('./courseService');

/**
 * Creates an enrolment plus its progress row, or rejects the attempt.
 *
 * Every course on this platform is free, so enrolment always grants access
 * immediately. There is no payment step and no pending state to clear: an
 * enrolment is recorded as 'free'/'not_required' regardless of what the course
 * document says, so a stale price on a course can never lock a student out.
 */
async function enroll({ student, course }) {
  if (course.status !== COURSE_STATUS.PUBLISHED) {
    throw ApiError.badRequest('This course is not open for enrolment yet.');
  }

  if (String(course.instructor?._id || course.instructor) === String(student._id)) {
    throw ApiError.badRequest('You cannot enrol in your own course.');
  }

  const existing = await Enrollment.findOne({ student: student._id, course: course._id });
  if (existing) throw ApiError.conflict('You are already enrolled in this course.');

  let enrollment;
  try {
    enrollment = await Enrollment.create({
      student: student._id,
      course: course._id,
      instructor: course.instructor?._id || course.instructor,
      accessType: 'free',
      paymentStatus: 'not_required',
      amountPaid: 0,
      currency: course.currency,
    });
  } catch (err) {
    // The unique index is the real guard against a double-click race.
    if (err.code === 11000) throw ApiError.conflict('You are already enrolled in this course.');
    throw err;
  }

  const progress = await progressService.initProgress({
    enrollment,
    courseId: course._id,
    studentId: student._id,
  });

  await courseService.syncEnrollmentCount(course._id);

  await notifications.onEnrollment({
    student: student._id,
    instructor: course.instructor?._id || course.instructor,
    course,
  });

  return { enrollment, progress, requiresPayment: false };
}

/**
 * The gate every learning endpoint calls. Returns the enrolment and progress,
 * or throws 403. Instructors and admins read their own course content freely.
 */
async function requireAccess({ user, course, role }) {
  const isOwner = String(course.instructor?._id || course.instructor) === String(user._id);
  if (role === 'admin' || isOwner) {
    return { enrollment: null, progress: null, privileged: true };
  }

  const enrollment = await Enrollment.findOne({ student: user._id, course: course._id });
  if (!enrollment) throw ApiError.forbidden('Enrol in this course to access its content.');
  if (enrollment.status === 'cancelled') {
    throw ApiError.forbidden('Your enrolment in this course is no longer active.');
  }
  const progress =
    (await Progress.findOne({ enrollment: enrollment._id })) ||
    (await progressService.initProgress({
      enrollment,
      courseId: course._id,
      studentId: user._id,
    }));

  enrollment.lastAccessedAt = new Date();
  await enrollment.save();

  return { enrollment, progress, privileged: false };
}

module.exports = { enroll, requireAccess };
