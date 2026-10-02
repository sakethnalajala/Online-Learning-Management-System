const Lesson = require('../models/Lesson');
const Module = require('../models/Module');
const Resource = require('../models/Resource');
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const Enrollment = require('../models/Enrollment');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok, created } = require('../utils/apiResponse');
const courseService = require('../services/courseService');
const progressService = require('../services/progressService');
const enrollmentService = require('../services/enrollmentService');
const notifications = require('../services/notificationService');

const detectProvider = (url) => {
  if (!url) return 'none';
  if (/youtu\.?be/i.test(url)) return 'youtube';
  if (url.startsWith('/')) return 'upload';
  return 'external';
};

/** GET /api/modules/:moduleId/lessons */
const listLessons = asyncHandler(async (req, res) => {
  const module = await Module.findById(req.params.moduleId);
  if (!module) throw ApiError.notFound('Module not found.');

  const course = await courseService.getCourseOr404(module.course);
  const canSeeDrafts =
    req.user.role === 'admin' || String(course.instructor) === String(req.user._id);

  const lessons = await Lesson.find({
    module: module._id,
    ...(canSeeDrafts ? {} : { isPublished: true }),
  })
    .sort({ order: 1 })
    .lean();

  return ok(res, lessons, 'Module lessons.');
});

/**
 * GET /api/lessons/:id
 * The learning-interface payload. Content and resources are only attached once
 * enrolment (or ownership) is proven — a preview lesson is the one exception.
 */
const getLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id).lean();
  if (!lesson) throw ApiError.notFound('Lesson not found.');

  const course = await courseService.getCourseOr404(lesson.course, [
    { path: 'instructor', select: 'name avatar' },
  ]);

  const isOwner = String(course.instructor._id) === String(req.user._id);
  const isAdmin = req.user.role === 'admin';

  let progress = null;
  let enrollment = null;

  if (!isOwner && !isAdmin) {
    if (!lesson.isPublished) throw ApiError.notFound('Lesson not found.');

    if (lesson.isPreview) {
      // Preview lessons are open, but we still surface progress when enrolled.
      enrollment = await Enrollment.findOne({ student: req.user._id, course: course._id });
    } else {
      const access = await enrollmentService.requireAccess({
        user: req.user,
        course,
        role: req.user.role,
      });
      enrollment = access.enrollment;
      progress = access.progress;
    }
  }

  const [resources, quiz] = await Promise.all([
    Resource.find({ lesson: lesson._id }).sort({ order: 1 }).lean(),
    Quiz.findOne({ lesson: lesson._id, ...(isOwner || isAdmin ? {} : { isPublished: true }) }).lean(),
  ]);

  // Record the resume point so "Continue learning" lands here next time.
  if (progress) {
    progress.lastLesson = lesson._id;
    progress.lastModule = lesson.module;
    progress.lastAccessedAt = new Date();
    await progress.save();
  }

  return ok(
    res,
    {
      lesson,
      resources,
      quiz: quiz
        ? {
            _id: quiz._id,
            title: quiz.title,
            description: quiz.description,
            questionCount: quiz.questionCount,
            passingScore: quiz.passingScore,
            timeLimitMinutes: quiz.timeLimitMinutes,
            maxAttempts: quiz.maxAttempts,
            isRequiredForCompletion: quiz.isRequiredForCompletion,
          }
        : null,
      isCompleted: progress ? progress.hasCompleted(lesson._id) : false,
      progress: progress
        ? { percentage: progress.percentage, completedLessons: progress.completedLessons.length, totalLessons: progress.totalLessons }
        : null,
      canEdit: isOwner || isAdmin,
    },
    'Lesson detail.'
  );
});

/** POST /api/modules/:moduleId/lessons */
const createLesson = asyncHandler(async (req, res) => {
  const module = await Module.findById(req.params.moduleId);
  if (!module) throw ApiError.notFound('Module not found.');

  const course = await courseService.getCourseOr404(module.course);
  courseService.assertCanEditCourse(course, req.user);

  const last = await Lesson.findOne({ module: module._id }).sort({ order: -1 }).select('order').lean();

  const lesson = await Lesson.create({
    course: course._id,
    module: module._id,
    title: req.body.title,
    summary: req.body.summary || '',
    content: req.body.content || '',
    type: req.body.type || 'video',
    videoUrl: req.body.videoUrl || '',
    videoProvider: req.body.videoProvider || detectProvider(req.body.videoUrl),
    durationMinutes: req.body.durationMinutes ?? 5,
    order: req.body.order ?? (last ? last.order + 1 : 0),
    isPreview: req.body.isPreview === true,
    isPublished: req.body.isPublished !== false,
  });

  await Module.findByIdAndUpdate(module._id, {
    lessonCount: await Lesson.countDocuments({ module: module._id }),
  });
  await progressService.syncCourseStats(course._id);
  await progressService.resyncAllProgress(course._id);

  // Tell enrolled students there is something new to watch.
  if (lesson.isPublished && course.status === 'published') {
    const students = await Enrollment.find({ course: course._id, status: { $ne: 'cancelled' } })
      .select('student')
      .lean();
    if (students.length) {
      await notifications.onNewLesson({
        studentIds: students.map((s) => s.student),
        course,
        lesson,
      });
    }
  }

  return created(res, lesson, 'Lesson created.');
});

/** PATCH /api/lessons/:id */
const updateLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) throw ApiError.notFound('Lesson not found.');

  const course = await courseService.getCourseOr404(lesson.course);
  courseService.assertCanEditCourse(course, req.user);

  const before = { published: lesson.isPublished, duration: lesson.durationMinutes };

  for (const field of [
    'title',
    'summary',
    'content',
    'type',
    'videoUrl',
    'durationMinutes',
    'order',
    'isPreview',
    'isPublished',
  ]) {
    if (req.body[field] !== undefined) lesson[field] = req.body[field];
  }

  if (req.body.videoUrl !== undefined) {
    lesson.videoProvider = req.body.videoProvider || detectProvider(req.body.videoUrl);
  }

  await lesson.save();

  if (before.duration !== lesson.durationMinutes) await progressService.syncCourseStats(course._id);
  if (before.published !== lesson.isPublished) await progressService.resyncAllProgress(course._id);

  return ok(res, lesson, 'Lesson updated.');
});

/** DELETE /api/lessons/:id */
const deleteLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) throw ApiError.notFound('Lesson not found.');

  const course = await courseService.getCourseOr404(lesson.course);
  courseService.assertCanEditCourse(course, req.user);

  const quiz = await Quiz.findOne({ lesson: lesson._id }).select('_id').lean();

  await Promise.all([
    quiz ? Question.deleteMany({ quiz: quiz._id }) : Promise.resolve(),
    Quiz.deleteMany({ lesson: lesson._id }),
    Resource.deleteMany({ lesson: lesson._id }),
  ]);

  const moduleId = lesson.module;
  await lesson.deleteOne();

  await Module.findByIdAndUpdate(moduleId, {
    lessonCount: await Lesson.countDocuments({ module: moduleId }),
  });
  await progressService.syncCourseStats(course._id);
  // Students who had completed this lesson need their percentage recomputed.
  await progressService.resyncAllProgress(course._id);

  return ok(res, null, 'Lesson deleted.');
});

/** PATCH /api/modules/:moduleId/lessons/reorder */
const reorderLessons = asyncHandler(async (req, res) => {
  const module = await Module.findById(req.params.moduleId);
  if (!module) throw ApiError.notFound('Module not found.');

  const course = await courseService.getCourseOr404(module.course);
  courseService.assertCanEditCourse(course, req.user);

  const ids = req.body.order;
  const lessons = await Lesson.find({ module: module._id, _id: { $in: ids } }).select('_id').lean();
  if (lessons.length !== ids.length) {
    throw ApiError.badRequest('The reorder list must contain exactly the lessons of this module.');
  }

  await Lesson.bulkWrite(
    ids.map((id, index) => ({ updateOne: { filter: { _id: id }, update: { $set: { order: index } } } }))
  );

  const updated = await Lesson.find({ module: module._id }).sort({ order: 1 }).lean();
  return ok(res, updated, 'Lessons reordered.');
});

module.exports = {
  listLessons,
  getLesson,
  createLesson,
  updateLesson,
  deleteLesson,
  reorderLessons,
};
