const Lesson = require('../models/Lesson');
const Module = require('../models/Module');
const Progress = require('../models/Progress');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const User = require('../models/User');
const notifications = require('./notificationService');
const certificateService = require('./certificateService');

/**
 * Lessons that count toward completion: published lessons inside published
 * modules. Draft content must not hold a student at 90% forever.
 */
async function countableLessonIds(courseId) {
  const modules = await Module.find({ course: courseId, isPublished: true }).select('_id').lean();
  const moduleIds = modules.map((m) => m._id);
  if (!moduleIds.length) return [];
  const lessons = await Lesson.find({
    course: courseId,
    module: { $in: moduleIds },
    isPublished: true,
  })
    .select('_id')
    .lean();
  return lessons.map((l) => l._id);
}

/** Creates the progress row that pairs with a new enrolment. */
async function initProgress({ enrollment, courseId, studentId }) {
  const lessonIds = await countableLessonIds(courseId);
  const firstLesson = await Lesson.findOne({ course: courseId, isPublished: true })
    .sort({ order: 1, createdAt: 1 })
    .select('_id module')
    .lean();

  return Progress.create({
    enrollment: enrollment._id,
    student: studentId,
    course: courseId,
    totalLessons: lessonIds.length,
    percentage: 0,
    lastLesson: firstLesson?._id,
    lastModule: firstLesson?.module,
  });
}

/**
 * Recomputes percentage from the completed-lesson set and, on first reaching
 * 100%, flips the enrolment to completed and issues the certificate.
 *
 * This is the single place completion is decided, so every path that can move
 * a student forward (lesson complete, quiz pass, content removal) agrees.
 */
async function recalculate(progress, { student, course } = {}) {
  const lessonIds = await countableLessonIds(progress.course);
  const validIds = new Set(lessonIds.map(String));

  // Drop entries for lessons that were deleted or unpublished since.
  progress.completedLessons = progress.completedLessons.filter((entry) =>
    validIds.has(String(entry.lesson))
  );

  progress.totalLessons = validIds.size;
  progress.percentage = validIds.size
    ? Math.round((progress.completedLessons.length / validIds.size) * 100)
    : 0;

  const justCompleted = progress.percentage === 100 && !progress.isCompleted;

  if (justCompleted) {
    progress.isCompleted = true;
    progress.completedAt = new Date();
  } else if (progress.percentage < 100 && progress.isCompleted) {
    // New lessons were added after completion: reopen the course.
    progress.isCompleted = false;
    progress.completedAt = undefined;
  }

  await progress.save();

  let certificate = null;

  if (justCompleted) {
    const enrollment = await Enrollment.findById(progress.enrollment);
    const courseDoc =
      course || (await Course.findById(progress.course).populate('instructor', 'name'));
    const studentDoc = student || (await User.findById(progress.student));

    if (enrollment && courseDoc && studentDoc) {
      enrollment.status = 'completed';
      enrollment.completedAt = progress.completedAt;

      const issued = await certificateService.issueCertificate({
        student: studentDoc,
        course: courseDoc,
        enrollment,
        progress,
      });
      certificate = issued.certificate;
      enrollment.certificate = certificate._id;
      await enrollment.save();

      await notifications.onCourseCompleted({
        student: studentDoc._id,
        instructor: courseDoc.instructor?._id || courseDoc.instructor,
        course: courseDoc,
      });
    }
  }

  return { progress, justCompleted, certificate };
}

/** Marks one lesson complete (idempotent) and recalculates. */
async function markLessonComplete(progress, lesson, { watchedSeconds = 0 } = {}) {
  if (!progress.hasCompleted(lesson._id)) {
    progress.completedLessons.push({
      lesson: lesson._id,
      module: lesson.module,
      completedAt: new Date(),
      watchedSeconds,
    });
    progress.totalWatchedMinutes += Math.round((watchedSeconds || 0) / 60);
  }
  progress.lastLesson = lesson._id;
  progress.lastModule = lesson.module;
  progress.lastAccessedAt = new Date();
  return recalculate(progress);
}

/** Un-marks a lesson, e.g. a student wants to redo it. */
async function markLessonIncomplete(progress, lessonId) {
  progress.completedLessons = progress.completedLessons.filter(
    (entry) => String(entry.lesson) !== String(lessonId)
  );
  return recalculate(progress);
}

/**
 * Keeps Course.lessonCount / moduleCount / totalDurationMinutes honest after
 * any structural edit, then re-syncs every enrolled student's denominator.
 */
async function syncCourseStats(courseId) {
  const [modules, lessons] = await Promise.all([
    Module.countDocuments({ course: courseId }),
    Lesson.find({ course: courseId }).select('durationMinutes').lean(),
  ]);

  const totalDurationMinutes = lessons.reduce((sum, l) => sum + (l.durationMinutes || 0), 0);

  await Course.findByIdAndUpdate(courseId, {
    moduleCount: modules,
    lessonCount: lessons.length,
    totalDurationMinutes,
  });

  return { moduleCount: modules, lessonCount: lessons.length, totalDurationMinutes };
}

/**
 * Re-runs recalculate() for everyone on a course. Called after the instructor
 * adds or deletes lessons so existing students' percentages stay correct.
 */
async function resyncAllProgress(courseId) {
  const rows = await Progress.find({ course: courseId });
  for (const row of rows) {
    // Sequential on purpose: each recalculate may issue a certificate.
    // eslint-disable-next-line no-await-in-loop
    await recalculate(row);
  }
  return rows.length;
}

/** Per-module breakdown used by the learning sidebar. */
function buildModuleProgress(modules, completedLessonIds) {
  const done = new Set(completedLessonIds.map(String));
  return modules.map((mod) => {
    const lessons = mod.lessons || [];
    const completed = lessons.filter((l) => done.has(String(l._id))).length;
    return {
      moduleId: mod._id,
      total: lessons.length,
      completed,
      percentage: lessons.length ? Math.round((completed / lessons.length) * 100) : 0,
    };
  });
}

module.exports = {
  countableLessonIds,
  initProgress,
  recalculate,
  markLessonComplete,
  markLessonIncomplete,
  syncCourseStats,
  resyncAllProgress,
  buildModuleProgress,
};
