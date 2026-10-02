const express = require('express');
const controller = require('../controllers/quizController');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { ROLES } = require('../config/constants');
const rules = require('../validators/contentValidators');
const { objectId } = require('../validators/common');

const router = express.Router();

router.use(protect, authorize(ROLES.INSTRUCTOR, ROLES.ADMIN));

router.patch(
  '/:id',
  validate([objectId('id'), ...rules.questionRules(true)]),
  controller.updateQuestion
);
router.delete('/:id', validate([objectId('id')]), controller.deleteQuestion);

module.exports = router;
