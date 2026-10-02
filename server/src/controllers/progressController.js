const Progress = require('../models/Progress');
const Lesson = require('../models/Lesson');
const Module = require('../models/Module');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/apiResponse');
const courseService = require('../services/courseService');
const enrollmentService = require('../services/enrollmentService');
const progressService = require('../services/progressService');

/** Loads the student's progress row for a course, or 403s. */
async function loadProgress(req, courseId) {
  const course = await courseService.getCourseOr404(courseId, [
    { path: 'instructor', select: 'name avatar' },
  ]);
  const { progress } = await enrollmentService.requireAccess({
    user: req.user,
    course,
    role: req.user.role,
  });
  if (!progress) {
    throw ApiError.badRequest('Progress is only tracked for enrolled students.');
  }
  return { course, progress };
}

/**
 * GET /api/progress/course/:courseId
 * Everything the learning interface needs in one call: the curriculum, which
 * lessons are done, the resume point and quiz outcomes.
 */
const getCourseProgress = asyncHandler(async (req, res) => {
  const { course, progress } = await loadProgress(req, req.params.courseId);

  const modules = await Module.find({ course: course._id, isPublished: true })
    .populate({
      path: 'lessons',
      match: { isPublished: true },
      select: 'title summary order durationMinutes type isPreview hasQuiz resourceCount module',
      options: { sort: { order: 1 } },
    })
    .sort({ order: 1 })
    .lean();

  const completedIds = progress.completedLessons.map((entry) => String(entry.lesson));

  // Best quiz result per lesson, so the sidebar can show a score badge.
  const attempts = await QuizAttempt.find({ student: req.user._id, course: course._id })
    .select('lesson score passed')
    .lean();
  const quizByLesson = {};
  for (const attempt of attempts) {
    const key = String(attempt.lesson);
    if (!quizByLesson[key] || attempt.score > quizByLesson[key].score) {
      quizByLesson[key] = { score: attempt.score, passed: attempt.passed };
    }
  }

  const curriculum = modules.map((mod) => ({
    ...mod,
    lessons: (mod.lessons || []).map((lesson) => ({
      ...lesson,
      isCompleted: completedIds.includes(String(lesson._id)),
      quizResult: quizByLesson[String(lesson._id)] || null,
    })),
  }));

  const flatLessons = curriculum.flatMap((m) => m.lessons);
  const nextLesson = flatLessons.find((l) => !l.isCompleted) || null;

  return ok(
    res,
    {
      course: {
        _id: course._id,
        title: course.title,
        slug: course.slug,
        thumbnail: course.thumbnail,
        instructor: course.instructor,
        lessonCount: course.lessonCount,
        totalDurationMinutes: course.totalDurationMinutes,
      },
      curriculum,
      progress: {
        percentage: progress.percentage,
        completedLessons: completedIds,
        completedCount: completedIds.length,
        totalLessons: progress.totalLessons,
        remainingCount: Math.max(0, progress.totalLessons - completedIds.length),
        isCompleted: progress.isCompleted,
        completedAt: progress.completedAt,
        startedAt: progress.startedAt,
        totalWatchedMinutes: progress.totalWatchedMinutes,
      },
      moduleProgress: progressService.buildModuleProgress(curriculum, completedIds),
      resume: {
        lessonId: progress.lastLesson || nextLesson?._id || null,
        moduleId: progress.lastModule || nextLesson?.module || null,
      },
      nextLesson,
    },
    'Course progress.'
  );
});

/**
 * POST /api/progress/lessons/:lessonId/complete
 * The single write that advances a student through a course. Refuses when a
 * required quiz has not been passed, so the gate cannot be skipped client-side.
 */
const completeLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.lessonId);
  if (!lesson) throw ApiError.notFound('Lesson not found.');
  if (!lesson.isPublished) throw ApiError.badRequest('This lesson is not published yet.');

  const { course, progress } = await loadProgress(req, lesson.course);

  if (lesson.hasQuiz) {
    const quiz = await Quiz.findOne({ lesson: lesson._id, isPublished: true }).lean();
    if (quiz?.isRequiredForCompletion) {
      const passed = await QuizAttempt.exists({
        quiz: quiz._id,
        student: req.user._id,
        passed: true,
      });
      if (!passed) {
        throw ApiError.badRequest(
          `Pass the quiz "${quiz.title}" (${quiz.passingScore}% or higher) to complete this lesson.`
        );
      }
    }
  }

  const result = await progressService.markLessonComplete(progress, lesson, {
    watchedSeconds: Number(req.body.watchedSeconds) || 0,
  });

  return ok(
    res,
    {
      percentage: result.progress.percentage,
      completedCount: result.progress.completedLessons.length,
      totalLessons: result.progress.totalLessons,
      isCompleted: result.progress.isCompleted,
      justCompletedCourse: result.justCompleted,
      certificate: result.certificate
        ? { _id: result.certificate._id, certificateId: result.certificate.certificateId }
        : null,
    },
    result.justCompleted
      ? `Course complete! Your certificate for "${course.title}" is ready.`
      : 'Lesson marked complete.'
  );
});

/** DELETE /api/progress/lessons/:lessonId/complete — undo a completion. */
const uncompleteLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.lessonId);
  if (!lesson) throw ApiError.notFound('Lesson not found.');

  const { progress } = await loadProgress(req, lesson.course);
  const result = await progressService.markLessonIncomplete(progress, lesson._id);

  return ok(
    res,
    {
      percentage: result.progress.percentage,
      completedCount: result.progress.completedLessons.length,
      totalLessons: result.progress.totalLessons,
      isCompleted: result.progress.isCompleted,
    },
    'Lesson marked as not complete.'
  );
});

/**
 * PATCH /api/progress/lessons/:lessonId/position
 * Lightweight "I am here" ping used to drive Continue Learning.
 */
const updatePosition = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.lessonId);
  if (!lesson) throw ApiError.notFound('Lesson not found.');

  const { progress } = await loadProgress(req, lesson.course);

  progress.lastLesson = lesson._id;
  progress.lastModule = lesson.module;
  progress.lastAccessedAt = new Date();

  const watched = Number(req.body.watchedSeconds) || 0;
  if (watched > 0) progress.totalWatchedMinutes += Math.round(watched / 60);

  await progress.save();

  return ok(
    res,
    { lastLesson: progress.lastLesson, lastModule: progress.lastModule },
    'Position saved.'
  );
});

/**
 * GET /api/progress/me
 * Student dashboard: continue-learning rail, streak-style totals and recent
 * activity, all derived from real progress rows.
 */
const getMyProgressOverview = asyncHandler(async (req, res) => {
  const rows = await Progress.find({ student: req.user._id })
    .populate({
      path: 'course',
      select: 'title slug thumbnail lessonCount totalDurationMinutes status',
      populate: { path: 'instructor', select: 'name avatar' },
    })
    .populate('lastLesson', 'title module')
    .sort({ lastAccessedAt: -1 })
    .lean();

  const live = rows.filter((row) => row.course);

  const attempts = await QuizAttempt.find({ student: req.user._id }).select('quiz score passed').lean();
  const bestByQuiz = new Map();
  for (const attempt of attempts) {
    const key = String(attempt.quiz);
    if (!bestByQuiz.has(key) || attempt.score > bestByQuiz.get(key).score) {
      bestByQuiz.set(key, attempt);
    }
  }
  const best = [...bestByQuiz.values()];

  return ok(
    res,
    {
      continueLearning: live
        .filter((row) => !row.isCompleted && row.course.status !== 'draft')
        .slice(0, 6)
        .map((row) => ({
          course: row.course,
          percentage: row.percentage,
          completedCount: row.completedLessons.length,
          totalLessons: row.totalLessons,
          lastLesson: row.lastLesson,
          lastAccessedAt: row.lastAccessedAt,
        })),
      summary: {
        enrolled: live.length,
        completed: live.filter((row) => row.isCompleted).length,
        inProgress: live.filter((row) => !row.isCompleted && row.percentage > 0).length,
        notStarted: live.filter((row) => row.percentage === 0).length,
        averageProgress: live.length
          ? Math.round(live.reduce((sum, row) => sum + row.percentage, 0) / live.length)
          : 0,
        lessonsCompleted: live.reduce((sum, row) => sum + row.completedLessons.length, 0),
        watchedMinutes: live.reduce((sum, row) => sum + (row.totalWatchedMinutes || 0), 0),
        quizzesTaken: best.length,
        quizzesPassed: best.filter((a) => a.passed).length,
        averageQuizScore: best.length
          ? Math.round(best.reduce((sum, a) => sum + a.score, 0) / best.length)
          : 0,
      },
      progressByCourse: live.map((row) => ({
        courseId: row.course._id,
        title: row.course.title,
        percentage: row.percentage,
        isCompleted: row.isCompleted,
      })),
    },
    'Your learning overview.'
  );
});

/**
 * GET /api/progress/students/:studentId/course/:courseId
 * Instructor drill-down into one student's progress on their course.
 */
const getStudentProgress = asyncHandler(async (req, res) => {
  const course = await courseService.getCourseOr404(req.params.courseId);
  courseService.assertCanEditCourse(course, req.user);

  const progress = await Progress.findOne({
    student: req.params.studentId,
    course: course._id,
  })
    .populate('student', 'name email avatar')
    .populate('completedLessons.lesson', 'title order')
    .populate('lastLesson', 'title')
    .lean();

  if (!progress) throw ApiError.notFound('That student is not enrolled in this course.');

  const attempts = await QuizAttempt.find({ student: req.params.studentId, course: course._id })
    .populate('quiz', 'title passingScore')
    .populate('lesson', 'title')
    .sort({ createdAt: -1 })
    .lean();

  return ok(res, { progress, quizAttempts: attempts }, 'Student progress.');
});

module.exports = {
  getCourseProgress,
  completeLesson,
  uncompleteLesson,
  updatePosition,
  getMyProgressOverview,
  getStudentProgress,
};
