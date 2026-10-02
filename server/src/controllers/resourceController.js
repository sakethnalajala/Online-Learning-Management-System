const Resource = require('../models/Resource');
const Lesson = require('../models/Lesson');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok, created } = require('../utils/apiResponse');
const courseService = require('../services/courseService');
const enrollmentService = require('../services/enrollmentService');
const { publicUrl } = require('../middleware/upload');

/** Infers the resource type from an uploaded file's mime type. */
const typeFromMime = (mime) => {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime === 'application/pdf') return 'pdf';
  return 'document';
};

async function loadLessonForEdit(lessonId, user) {
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) throw ApiError.notFound('Lesson not found.');
  const course = await courseService.getCourseOr404(lesson.course);
  courseService.assertCanEditCourse(course, user);
  return { lesson, course };
}

const refreshLessonCount = (lessonId) =>
  Resource.countDocuments({ lesson: lessonId }).then((resourceCount) =>
    Lesson.findByIdAndUpdate(lessonId, { resourceCount })
  );

/**
 * GET /api/lessons/:lessonId/resources
 * Gated the same way lesson content is: enrolled students, the owner, or admin.
 */
const listResources = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.lessonId);
  if (!lesson) throw ApiError.notFound('Lesson not found.');

  const course = await courseService.getCourseOr404(lesson.course);
  const isOwner = String(course.instructor) === String(req.user._id);

  if (!isOwner && req.user.role !== 'admin' && !lesson.isPreview) {
    await enrollmentService.requireAccess({ user: req.user, course, role: req.user.role });
  }

  const resources = await Resource.find({ lesson: lesson._id }).sort({ order: 1 }).lean();
  return ok(res, resources, 'Lesson resources.');
});

/** POST /api/lessons/:lessonId/resources — URL or text based. */
const createResource = asyncHandler(async (req, res) => {
  const { lesson, course } = await loadLessonForEdit(req.params.lessonId, req.user);

  const last = await Resource.findOne({ lesson: lesson._id }).sort({ order: -1 }).select('order').lean();

  const resource = await Resource.create({
    course: course._id,
    lesson: lesson._id,
    title: req.body.title,
    description: req.body.description || '',
    type: req.body.type,
    url: req.body.url || '',
    textContent: req.body.textContent || '',
    order: req.body.order ?? (last ? last.order + 1 : 0),
    isDownloadable: req.body.isDownloadable !== false,
    uploadedBy: req.user._id,
  });

  await refreshLessonCount(lesson._id);
  return created(res, resource, 'Resource added.');
});

/**
 * POST /api/lessons/:lessonId/resources/upload
 * Multipart variant: the file becomes the resource's url.
 */
const uploadResource = asyncHandler(async (req, res) => {
  const { lesson, course } = await loadLessonForEdit(req.params.lessonId, req.user);

  if (!req.file) throw ApiError.badRequest('Please attach a file.');

  const last = await Resource.findOne({ lesson: lesson._id }).sort({ order: -1 }).select('order').lean();

  const resource = await Resource.create({
    course: course._id,
    lesson: lesson._id,
    title: req.body.title?.trim() || req.file.originalname,
    description: req.body.description || '',
    type: req.body.type || typeFromMime(req.file.mimetype),
    url: publicUrl(req.file),
    fileName: req.file.originalname,
    fileSize: req.file.size,
    mimeType: req.file.mimetype,
    isUploaded: true,
    order: last ? last.order + 1 : 0,
    isDownloadable: req.body.isDownloadable !== 'false',
    uploadedBy: req.user._id,
  });

  await refreshLessonCount(lesson._id);
  return created(res, resource, 'File uploaded and attached to the lesson.');
});

/** GET /api/resources/:id */
const getResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id).lean();
  if (!resource) throw ApiError.notFound('Resource not found.');

  const course = await courseService.getCourseOr404(resource.course);
  const isOwner = String(course.instructor) === String(req.user._id);

  if (!isOwner && req.user.role !== 'admin') {
    await enrollmentService.requireAccess({ user: req.user, course, role: req.user.role });
  }

  return ok(res, resource, 'Resource detail.');
});

/** PATCH /api/resources/:id */
const updateResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);
  if (!resource) throw ApiError.notFound('Resource not found.');

  const course = await courseService.getCourseOr404(resource.course);
  courseService.assertCanEditCourse(course, req.user);

  for (const field of ['title', 'description', 'type', 'url', 'textContent', 'order', 'isDownloadable']) {
    if (req.body[field] !== undefined) resource[field] = req.body[field];
  }

  await resource.save();
  return ok(res, resource, 'Resource updated.');
});

/** DELETE /api/resources/:id */
const deleteResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);
  if (!resource) throw ApiError.notFound('Resource not found.');

  const course = await courseService.getCourseOr404(resource.course);
  courseService.assertCanEditCourse(course, req.user);

  const lessonId = resource.lesson;
  await resource.deleteOne();
  await refreshLessonCount(lessonId);

  return ok(res, null, 'Resource deleted.');
});

/** GET /api/resources/admin/all — platform-wide learning-resource management. */
const adminListResources = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.type && req.query.type !== 'all') filter.type = req.query.type;
  if (req.query.course) filter.course = req.query.course;

  const resources = await Resource.find(filter)
    .populate('course', 'title slug')
    .populate('lesson', 'title')
    .populate('uploadedBy', 'name email')
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  const byType = await Resource.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]);

  return ok(
    res,
    {
      resources,
      summary: byType.map((row) => ({ type: row._id, count: row.count })),
      totalUploadedBytes: resources.reduce((sum, r) => sum + (r.fileSize || 0), 0),
    },
    'Platform resources.'
  );
});

module.exports = {
  listResources,
  createResource,
  uploadResource,
  getResource,
  updateResource,
  deleteResource,
  adminListResources,
};
