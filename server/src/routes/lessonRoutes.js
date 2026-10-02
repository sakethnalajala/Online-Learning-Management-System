const express = require('express');
const controller = require('../controllers/lessonController');
const resourceController = require('../controllers/resourceController');
const quizController = require('../controllers/quizController');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { upload } = require('../middleware/upload');
const { ROLES } = require('../config/constants');
const rules = require('../validators/contentValidators');
const { objectId } = require('../validators/common');

const router = express.Router();

router.use(protect);

const instructorOrAdmin = authorize(ROLES.INSTRUCTOR, ROLES.ADMIN);

/* ── Resources nested under a lesson ────────────────────────────────────── */

router.get('/:lessonId/resources', validate([objectId('lessonId')]), resourceController.listResources);
router.post(
  '/:lessonId/resources',
  instructorOrAdmin,
  validate([objectId('lessonId'), ...rules.resourceRules(false)]),
  resourceController.createResource
);
router.post(
  '/:lessonId/resources/upload',
  instructorOrAdmin,
  upload.single('file'),
  validate([objectId('lessonId')]),
  resourceController.uploadResource
);

/* ── Quiz nested under a lesson ─────────────────────────────────────────── */

router.get('/:lessonId/quiz', validate([objectId('lessonId')]), quizController.getQuizByLesson);
router.post(
  '/:lessonId/quiz',
  instructorOrAdmin,
  validate([objectId('lessonId'), ...rules.quizRules(false)]),
  quizController.createQuiz
);

/* ── The lesson itself ──────────────────────────────────────────────────── */

router.get('/:id', validate([objectId('id')]), controller.getLesson);
router.patch(
  '/:id',
  instructorOrAdmin,
  validate([objectId('id'), ...rules.lessonRules(true)]),
  controller.updateLesson
);
router.delete('/:id', instructorOrAdmin, validate([objectId('id')]), controller.deleteLesson);

module.exports = router;
