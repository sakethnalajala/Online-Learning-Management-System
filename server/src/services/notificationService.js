const Notification = require('../models/Notification');
const { NOTIFICATION_TYPES } = require('../config/constants');

/**
 * Notifications are a side effect: a failure here must never roll back the
 * action that triggered it (an enrolment is still valid if the bell icon
 * misses an entry), so every helper swallows its own errors.
 */
async function notify({ user, type, title, message = '', link = '', course, lesson, actor }) {
  try {
    if (!user) return null;
    return await Notification.create({ user, type, title, message, link, course, lesson, actor });
  } catch (err) {
    console.error('[notifications] failed to create:', err.message);
    return null;
  }
}

async function notifyMany(recipients, payload) {
  const unique = [...new Set(recipients.filter(Boolean).map(String))];
  if (!unique.length) return [];
  try {
    return await Notification.insertMany(
      unique.map((user) => ({ ...payload, user })),
      { ordered: false }
    );
  } catch (err) {
    console.error('[notifications] bulk create failed:', err.message);
    return [];
  }
}

/* ── Domain events ───────────────────────────────────────────────────────── */

const onEnrollment = ({ student, instructor, course }) =>
  Promise.all([
    notify({
      user: student,
      type: NOTIFICATION_TYPES.ENROLLMENT,
      title: 'Enrolment confirmed',
      message: `You are now enrolled in "${course.title}". Start learning whenever you are ready.`,
      link: `/learn/${course._id}`,
      course: course._id,
    }),
    notify({
      user: instructor,
      type: NOTIFICATION_TYPES.ENROLLMENT,
      title: 'New student enrolled',
      message: `A new student just enrolled in "${course.title}".`,
      link: `/instructor/courses/${course._id}/students`,
      course: course._id,
      actor: student,
    }),
  ]);

const onNewLesson = ({ studentIds, course, lesson }) =>
  notifyMany(studentIds, {
    type: NOTIFICATION_TYPES.NEW_LESSON,
    title: 'New lesson published',
    message: `"${lesson.title}" was added to "${course.title}".`,
    link: `/learn/${course._id}?lesson=${lesson._id}`,
    course: course._id,
    lesson: lesson._id,
  });

const onCourseApproved = ({ instructor, course }) =>
  notify({
    user: instructor,
    type: NOTIFICATION_TYPES.COURSE_APPROVAL,
    title: 'Course approved',
    message: `"${course.title}" has been approved and is now live for students.`,
    link: `/instructor/courses/${course._id}`,
    course: course._id,
  });

const onCourseRejected = ({ instructor, course, reason }) =>
  notify({
    user: instructor,
    type: NOTIFICATION_TYPES.COURSE_REJECTION,
    title: 'Course needs changes',
    message: reason
      ? `"${course.title}" was not approved: ${reason}`
      : `"${course.title}" was not approved. Please review and resubmit.`,
    link: `/instructor/courses/${course._id}`,
    course: course._id,
  });

const onCourseCompleted = ({ student, instructor, course }) =>
  Promise.all([
    notify({
      user: student,
      type: NOTIFICATION_TYPES.COURSE_COMPLETION,
      title: 'Course completed',
      message: `Congratulations! You finished "${course.title}". Your certificate is ready.`,
      link: '/student/certificates',
      course: course._id,
    }),
    notify({
      user: instructor,
      type: NOTIFICATION_TYPES.COURSE_COMPLETION,
      title: 'A student completed your course',
      message: `A student just completed "${course.title}".`,
      link: `/instructor/courses/${course._id}/students`,
      course: course._id,
      actor: student,
    }),
  ]);

const onCertificateIssued = ({ student, course, certificate }) =>
  notify({
    user: student,
    type: NOTIFICATION_TYPES.CERTIFICATE,
    title: 'Certificate issued',
    message: `Your certificate for "${course.title}" is available (ID ${certificate.certificateId}).`,
    link: '/student/certificates',
    course: course._id,
  });

const onInstructorUpdate = ({ studentIds, course, headline, body, actor }) =>
  notifyMany(studentIds, {
    type: NOTIFICATION_TYPES.INSTRUCTOR_UPDATE,
    title: headline || `Update in "${course.title}"`,
    message: body || 'Your instructor posted an update.',
    link: `/learn/${course._id}`,
    course: course._id,
    actor,
  });

const onCourseSubmitted = ({ adminIds, course, instructorName }) =>
  notifyMany(adminIds, {
    type: NOTIFICATION_TYPES.COURSE_APPROVAL,
    title: 'Course awaiting review',
    message: `${instructorName} submitted "${course.title}" for approval.`,
    link: '/admin/courses',
    course: course._id,
  });

const onNewReview = ({ instructor, course, rating, actor }) =>
  notify({
    user: instructor,
    type: NOTIFICATION_TYPES.REVIEW,
    title: 'New course review',
    message: `Your course "${course.title}" received a ${rating}-star review.`,
    link: `/instructor/courses/${course._id}`,
    course: course._id,
    actor,
  });

module.exports = {
  notify,
  notifyMany,
  onEnrollment,
  onNewLesson,
  onCourseApproved,
  onCourseRejected,
  onCourseCompleted,
  onCertificateIssued,
  onInstructorUpdate,
  onCourseSubmitted,
  onNewReview,
};
