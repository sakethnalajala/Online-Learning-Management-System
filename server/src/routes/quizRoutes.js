const express = require('express');
const controller = require('../controllers/quizController');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { ROLES } = require('../config/constants');
const rules = require('../validators/contentValidators');
const { objectId } = require('../validators/common');

const router = express.Router();

router.use(protect);

const instructorOrAdmin = authorize(ROLES.INSTRUCTOR, ROLES.ADMIN);

// Static paths before /:id so they are not captured as an id.
router.get('/me/results', controller.listMyResults);
router.get('/attempts/:attemptId', validate([objectId('attemptId')]), controller.getAttempt);

router.get('/:id', validate([objectId('id')]), controller.getQuiz);
router.patch(
  '/:id',
  instructorOrAdmin,
  validate([objectId('id'), ...rules.quizRules(true)]),
  controller.updateQuiz
);
router.delete('/:id', instructorOrAdmin, validate([objectId('id')]), controller.deleteQuiz);

// Questions.
router.post(
  '/:id/questions',
  instructorOrAdmin,
  validate([objectId('id'), ...rules.questionRules(false)]),
  controller.addQuestion
);

// Student attempts.
router.post(
  '/:id/submit',
  authorize(ROLES.STUDENT),
  validate(rules.submitQuizRules),
  controller.submitQuiz
);
router.get('/:id/attempts', validate([objectId('id')]), controller.listMyAttempts);
router.get('/:id/results', instructorOrAdmin, validate([objectId('id')]), controller.getQuizResults);

module.exports = router;
