const express = require('express');
const controller = require('../controllers/reviewController');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const rules = require('../validators/userValidators');
const { objectId } = require('../validators/common');

const router = express.Router();

router.use(protect);

router.get('/me', controller.listMyReviews);
router.get('/me/course/:courseId', validate([objectId('courseId')]), controller.getMyReviewForCourse);

router.patch(
  '/:id',
  validate([objectId('id'), ...rules.reviewRules(true)]),
  controller.updateReview
);
router.delete('/:id', validate([objectId('id')]), controller.deleteReview);

module.exports = router;
