const express = require('express');
const controller = require('../controllers/moduleController');
const lessonController = require('../controllers/lessonController');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { ROLES } = require('../config/constants');
const rules = require('../validators/contentValidators');
const { objectId } = require('../validators/common');

const router = express.Router();

router.use(protect);

const instructorOrAdmin = authorize(ROLES.INSTRUCTOR, ROLES.ADMIN);

// Lessons nested under a module.
router.get('/:moduleId/lessons', validate([objectId('moduleId')]), lessonController.listLessons);
router.post(
  '/:moduleId/lessons',
  instructorOrAdmin,
  validate([objectId('moduleId'), ...rules.lessonRules(false)]),
  lessonController.createLesson
);
router.patch(
  '/:moduleId/lessons/reorder',
  instructorOrAdmin,
  validate([objectId('moduleId'), ...rules.reorderRules]),
  lessonController.reorderLessons
);

router.get('/:id', validate([objectId('id')]), controller.getModule);
router.patch(
  '/:id',
  instructorOrAdmin,
  validate([objectId('id'), ...rules.moduleRules(true)]),
  controller.updateModule
);
router.delete('/:id', instructorOrAdmin, validate([objectId('id')]), controller.deleteModule);

module.exports = router;
