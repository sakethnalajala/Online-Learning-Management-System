/**
 * Spreads seeded records over the past few weeks.
 *
 * Everything the seeder writes lands with the same timestamp, which makes every
 * trend chart a single spike on today. This walks the records back over a
 * realistic window so the dashboards show something worth looking at — the
 * rows themselves are unchanged, only when they were created.
 *
 * Order is preserved: a user exists before the course they wrote, a course
 * before the enrolment on it, and an enrolment before its progress, quiz
 * attempts, review and certificate.
 *
 * Writes go through `Model.collection` (the raw driver) on purpose: Mongoose's
 * timestamps plugin marks `createdAt` immutable, so an ordinary update would
 * silently drop it.
 */

const {
  User,
  Course,
  Enrollment,
  Progress,
  QuizAttempt,
  Review,
  Certificate,
  Notification,
} = require('../models');

const DAY = 24 * 60 * 60 * 1000;

const daysAgo = (days, hour = 10) => {
  const date = new Date(Date.now() - days * DAY);
  date.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
  return date;
};

/** Raw update, so immutable `createdAt` is actually written. */
const touch = (Model, filter, fields) => Model.collection.updateOne(filter, { $set: fields });

const setDates = (Model, id, createdAt, extra = {}) =>
  touch(Model, { _id: id }, { createdAt, updatedAt: createdAt, ...extra });

/** Spreads `count` items across `[oldest, newest]` days ago, oldest first. */
const spread = (index, count, oldest, newest) => {
  if (count <= 1) return oldest;
  const step = (oldest - newest) / (count - 1);
  return Math.round(oldest - index * step);
};

async function backdate() {
  /* ── Users: the admin and instructors first, then students ───────────── */

  const admin = await User.findOne({ role: 'admin' }).select('_id').lean();
  if (admin) await setDates(User, admin._id, daysAgo(75, 9));

  const instructors = await User.find({ role: 'instructor' })
    .select('_id')
    .sort({ createdAt: 1 })
    .lean();
  for (const [index, user] of instructors.entries()) {
    // eslint-disable-next-line no-await-in-loop
    await setDates(User, user._id, daysAgo(spread(index, instructors.length, 70, 46), 11));
  }

  const students = await User.find({ role: 'student' }).select('_id').sort({ createdAt: 1 }).lean();
  for (const [index, user] of students.entries()) {
    // eslint-disable-next-line no-await-in-loop
    await setDates(User, user._id, daysAgo(spread(index, students.length, 41, 2), 14));
  }

  /* ── Courses, with lifecycle timestamps that stay consistent ─────────── */

  const courses = await Course.find().select('_id status').sort({ createdAt: 1 }).lean();
  for (const [index, course] of courses.entries()) {
    const createdDays = spread(index, courses.length, 44, 8);
    const createdAt = daysAgo(createdDays, 12);

    const extra = {};
    if (['pending', 'approved', 'published', 'unpublished', 'rejected'].includes(course.status)) {
      extra.submittedAt = daysAgo(Math.max(2, createdDays - 3), 15);
    }
    if (['approved', 'published', 'unpublished', 'rejected'].includes(course.status)) {
      extra.reviewedAt = daysAgo(Math.max(1, createdDays - 5), 16);
    }
    if (course.status === 'published') {
      extra.publishedAt = daysAgo(Math.max(1, createdDays - 5), 16);
    }

    // eslint-disable-next-line no-await-in-loop
    await setDates(Course, course._id, createdAt, extra);
  }

  /* ── Enrolments, and everything that hangs off them ──────────────────── */

  const enrollments = await Enrollment.find()
    .select('_id course student status')
    .sort({ createdAt: 1 })
    .lean();

  // Publish dates, so an enrolment never predates its course going live.
  const publishedAt = new Map(
    (await Course.find().select('_id publishedAt createdAt').lean()).map((course) => [
      String(course._id),
      course.publishedAt || course.createdAt,
    ])
  );

  for (const [index, enrollment] of enrollments.entries()) {
    const wanted = daysAgo(spread(index, enrollments.length, 28, 0), 13);
    const live = publishedAt.get(String(enrollment.course));

    const createdAt =
      live && wanted < live ? new Date(live.getTime() + 6 * 60 * 60 * 1000) : wanted;

    const after = (hours) =>
      new Date(Math.min(Date.now(), createdAt.getTime() + hours * 60 * 60 * 1000));

    // eslint-disable-next-line no-await-in-loop
    await setDates(Enrollment, enrollment._id, createdAt, {
      enrolledAt: createdAt,
      lastAccessedAt: after(72),
    });

    // eslint-disable-next-line no-await-in-loop
    await touch(
      Progress,
      { enrollment: enrollment._id },
      { createdAt, updatedAt: after(48), startedAt: createdAt, lastAccessedAt: after(48) }
    );

    // eslint-disable-next-line no-await-in-loop
    const attempts = await QuizAttempt.find({ enrollment: enrollment._id }).select('_id').lean();
    for (const [attemptIndex, attempt] of attempts.entries()) {
      const at = after(6 + attemptIndex * 9);
      // eslint-disable-next-line no-await-in-loop
      await setDates(QuizAttempt, attempt._id, at, { startedAt: at, submittedAt: at });
    }

    if (enrollment.status === 'completed') {
      const completedAt = after(60);
      // eslint-disable-next-line no-await-in-loop
      await touch(Enrollment, { _id: enrollment._id }, { completedAt });
      // eslint-disable-next-line no-await-in-loop
      await touch(Progress, { enrollment: enrollment._id }, { completedAt });
      // eslint-disable-next-line no-await-in-loop
      await touch(
        Certificate,
        { enrollment: enrollment._id },
        { createdAt: completedAt, updatedAt: completedAt, issuedAt: completedAt }
      );
    }

    // A review comes after the student has actually used the course.
    // eslint-disable-next-line no-await-in-loop
    await touch(
      Review,
      { student: enrollment.student, course: enrollment.course },
      { createdAt: after(72), updatedAt: after(72) }
    );
  }

  /* ── Notifications follow whatever triggered them ────────────────────── */

  const notifications = await Notification.find().select('_id course isRead').lean();
  for (const notification of notifications) {
    const anchor = notification.course ? publishedAt.get(String(notification.course)) : null;
    const at = anchor
      ? new Date(Math.min(Date.now(), anchor.getTime() + 2 * DAY))
      : daysAgo(Math.floor(Math.random() * 20) + 1, 12);
    // eslint-disable-next-line no-await-in-loop
    await setDates(Notification, notification._id, at, notification.isRead ? { readAt: at } : {});
  }

  return {
    users: instructors.length + students.length + (admin ? 1 : 0),
    courses: courses.length,
    enrollments: enrollments.length,
    notifications: notifications.length,
  };
}

module.exports = { backdate };
