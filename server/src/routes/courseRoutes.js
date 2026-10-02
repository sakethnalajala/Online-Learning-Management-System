const express = require('express');
const controller = require('../controllers/courseController');
const moduleController = require('../controllers/moduleController');
const reviewController = require('../controllers/reviewController');
const validate = require('../middleware/validate');
const { protect, optionalAuth } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { upload } = require('../middleware/upload');
const { ROLES } = require('../config/constants');
const courseRules = require('../validators/courseValidators');
const contentRules = require('../validators/contentValidators');
const userRules = require('../validators/userValidators');
const { objectId, paginationRules } = require('../validators/common');

const router = express.Router();

const instructorOrAdmin = [protect, authorize(ROLES.INSTRUCTOR, ROLES.ADMIN)];
const adminOnly = [protect, authorize(ROLES.ADMIN)];

/* ── Static paths first, so they are not swallowed by /:idOrSlug ─────────── */

router.get('/stats', controller.getPublicStats);
router.get('/featured', controller.getFeatured);
router.get('/', optionalAuth, validate(courseRules.listCourseRules), controller.listCourses);

router.get('/instructor/mine', ...instructorOrAdmin, controller.listMyCourses);
router.get('/admin/all', ...adminOnly, controller.adminListCourses);

router.post('/', ...instructorOrAdmin, validate(courseRules.createCourseRules), controller.createCourse);

/* ── Reviews (nested under a course) ────────────────────────────────────── */

router.get(
  '/:courseId/reviews',
  optionalAuth,
  validate([objectId('courseId'), ...paginationRules]),
  reviewController.listCourseReviews
);
router.get(
  '/:courseId/reviews/summary',
  validate([objectId('courseId')]),
  reviewController.getReviewSummary
);
router.post(
  '/:courseId/reviews',
  protect,
  authorize(ROLES.STUDENT),
  validate([objectId('courseId'), ...userRules.reviewRules(false)]),
  reviewController.createReview
);

/* ── Modules (nested under a course) ────────────────────────────────────── */

router.get(
  '/:courseId/modules',
  protect,
  validate([objectId('courseId')]),
  moduleController.listModules
);
router.post(
  '/:courseId/modules',
  ...instructorOrAdmin,
  validate([objectId('courseId'), ...contentRules.moduleRules(false)]),
  moduleController.createModule
);
router.patch(
  '/:courseId/modules/reorder',
  ...instructorOrAdmin,
  validate([objectId('courseId'), ...contentRules.reorderRules]),
  moduleController.reorderModules
);

/* ── Instructor course operations ───────────────────────────────────────── */

router.get(
  '/:id/students',
  ...instructorOrAdmin,
  validate([objectId('id'), ...paginationRules]),
  controller.listCourseStudents
);
router.get('/:id/analytics', ...instructorOrAdmin, validate([objectId('id')]), controller.getCourseAnalytics);

router.post(
  '/:id/thumbnail',
  ...instructorOrAdmin,
  upload.single('thumbnail'),
  validate([objectId('id')]),
  controller.uploadThumbnail
);
router.post('/:id/submit', ...instructorOrAdmin, validate([objectId('id')]), controller.submitForApproval);
router.post('/:id/publish', ...instructorOrAdmin, validate([objectId('id')]), controller.publishCourse);
router.post('/:id/unpublish', ...instructorOrAdmin, validate([objectId('id')]), controller.unpublishCourse);
router.post(
  '/:id/announce',
  ...instructorOrAdmin,
  validate(courseRules.announcementRules),
  controller.announce
);
router.post('/:id/resync', ...instructorOrAdmin, validate([objectId('id')]), controller.resyncCourse);

/* ── Admin moderation ───────────────────────────────────────────────────── */

router.post('/:id/approve', ...adminOnly, validate([objectId('id')]), controller.approveCourse);
router.post('/:id/reject', ...adminOnly, validate(courseRules.rejectCourseRules), controller.rejectCourse);
router.patch('/:id/feature', ...adminOnly, validate([objectId('id')]), controller.toggleFeatured);

/* ── Single course by id or slug (must stay last) ───────────────────────── */

router.get('/:idOrSlug', optionalAuth, controller.getCourse);
router.patch('/:id', ...instructorOrAdmin, validate(courseRules.updateCourseRules), controller.updateCourse);
router.delete('/:id', ...instructorOrAdmin, validate([objectId('id')]), controller.deleteCourse);

module.exports = router;
