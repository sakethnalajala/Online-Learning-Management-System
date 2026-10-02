const express = require('express');
const controller = require('../controllers/progressController');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { ROLES } = require('../config/constants');
const { objectId } = require('../validators/common');

const router = express.Router();

router.use(protect);

router.get('/me', controller.getMyProgressOverview);
router.get('/course/:courseId', validate([objectId('courseId')]), controller.getCourseProgress);

router.post(
  '/lessons/:lessonId/complete',
  validate([objectId('lessonId')]),
  controller.completeLesson
);
router.delete(
  '/lessons/:lessonId/complete',
  validate([objectId('lessonId')]),
  controller.uncompleteLesson
);
router.patch(
  '/lessons/:lessonId/position',
  validate([objectId('lessonId')]),
  controller.updatePosition
);

// Instructor drill-down.
router.get(
  '/students/:studentId/course/:courseId',
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN),
  validate([objectId('studentId'), objectId('courseId')]),
  controller.getStudentProgress
);

module.exports = router;
