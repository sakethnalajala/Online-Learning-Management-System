const express = require('express');
const controller = require('../controllers/enrollmentController');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { ROLES } = require('../config/constants');
const { objectId, paginationRules } = require('../validators/common');

const router = express.Router();

router.use(protect);

// Student.
router.post('/', authorize(ROLES.STUDENT), controller.enroll);
router.get('/me', validate(paginationRules), controller.listMyEnrollments);
router.get(
  '/me/course/:courseId',
  validate([objectId('courseId')]),
  controller.getMyEnrollmentForCourse
);

// Admin.
router.get('/', authorize(ROLES.ADMIN), validate(paginationRules), controller.adminListEnrollments);
router.patch(
  '/:id/access',
  authorize(ROLES.ADMIN),
  validate([objectId('id')]),
  controller.grantAccess
);

router.delete('/:id', validate([objectId('id')]), controller.unenroll);

module.exports = router;
