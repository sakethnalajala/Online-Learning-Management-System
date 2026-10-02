const Module = require('../models/Module');
const Lesson = require('../models/Lesson');
const Resource = require('../models/Resource');
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok, created } = require('../utils/apiResponse');
const courseService = require('../services/courseService');
const progressService = require('../services/progressService');

/** Loads the parent course and checks write permission in one step. */
async function loadEditableCourse(courseId, user) {
  const course = await courseService.getCourseOr404(courseId);
  courseService.assertCanEditCourse(course, user);
  return course;
}

/** GET /api/courses/:courseId/modules */
const listModules = asyncHandler(async (req, res) => {
  const course = await courseService.getCourseOr404(req.params.courseId);

  const isOwner = String(course.instructor) === String(req.user._id);
  const canSeeDrafts = isOwner || req.user.role === 'admin';

  const modules = await Module.find({
    course: course._id,
    ...(canSeeDrafts ? {} : { isPublished: true }),
  })
    .populate({
      path: 'lessons',
      select: 'title order durationMinutes type isPreview isPublished hasQuiz resourceCount',
      options: { sort: { order: 1 } },
    })
    .sort({ order: 1 })
    .lean();

  return ok(res, modules, 'Course modules.');
});

/** POST /api/courses/:courseId/modules */
const createModule = asyncHandler(async (req, res) => {
  const course = await loadEditableCourse(req.params.courseId, req.user);

  // Append to the end unless the client asked for a specific position.
  const last = await Module.findOne({ course: course._id }).sort({ order: -1 }).select('order').lean();
  const order = req.body.order ?? (last ? last.order + 1 : 0);

  const module = await Module.create({
    course: course._id,
    title: req.body.title,
    description: req.body.description || '',
    order,
    isPublished: req.body.isPublished !== false,
  });

  await progressService.syncCourseStats(course._id);

  return created(res, module, 'Module created.');
});

/** GET /api/modules/:id */
const getModule = asyncHandler(async (req, res) => {
  const module = await Module.findById(req.params.id)
    .populate({ path: 'lessons', options: { sort: { order: 1 } } })
    .lean();
  if (!module) throw ApiError.notFound('Module not found.');

  return ok(res, module, 'Module detail.');
});

/** PATCH /api/modules/:id */
const updateModule = asyncHandler(async (req, res) => {
  const module = await Module.findById(req.params.id);
  if (!module) throw ApiError.notFound('Module not found.');

  await loadEditableCourse(module.course, req.user);

  const wasPublished = module.isPublished;

  for (const field of ['title', 'description', 'order', 'isPublished']) {
    if (req.body[field] !== undefined) module[field] = req.body[field];
  }
  await module.save();

  // Publishing or hiding a module changes every student's denominator.
  if (wasPublished !== module.isPublished) {
    await progressService.resyncAllProgress(module.course);
  }

  return ok(res, module, 'Module updated.');
});

/** DELETE /api/modules/:id — removes its lessons, resources and quizzes too. */
const deleteModule = asyncHandler(async (req, res) => {
  const module = await Module.findById(req.params.id);
  if (!module) throw ApiError.notFound('Module not found.');

  const course = await loadEditableCourse(module.course, req.user);

  const lessons = await Lesson.find({ module: module._id }).select('_id').lean();
  const lessonIds = lessons.map((l) => l._id);
  const quizzes = await Quiz.find({ lesson: { $in: lessonIds } }).select('_id').lean();

  await Promise.all([
    Question.deleteMany({ quiz: { $in: quizzes.map((q) => q._id) } }),
    Quiz.deleteMany({ lesson: { $in: lessonIds } }),
    Resource.deleteMany({ lesson: { $in: lessonIds } }),
    Lesson.deleteMany({ _id: { $in: lessonIds } }),
  ]);
  await module.deleteOne();

  await progressService.syncCourseStats(course._id);
  await progressService.resyncAllProgress(course._id);

  return ok(res, null, `Module deleted along with ${lessonIds.length} lesson(s).`);
});

/**
 * PATCH /api/courses/:courseId/modules/reorder
 * Body: { order: [moduleId, moduleId, ...] }
 */
const reorderModules = asyncHandler(async (req, res) => {
  const course = await loadEditableCourse(req.params.courseId, req.user);
  const ids = req.body.order;

  const modules = await Module.find({ course: course._id, _id: { $in: ids } }).select('_id').lean();
  if (modules.length !== ids.length) {
    throw ApiError.badRequest('The reorder list must contain exactly the modules of this course.');
  }

  await Module.bulkWrite(
    ids.map((id, index) => ({ updateOne: { filter: { _id: id }, update: { $set: { order: index } } } }))
  );

  const updated = await Module.find({ course: course._id }).sort({ order: 1 }).lean();
  return ok(res, updated, 'Modules reordered.');
});

module.exports = {
  listModules,
  createModule,
  getModule,
  updateModule,
  deleteModule,
  reorderModules,
};
