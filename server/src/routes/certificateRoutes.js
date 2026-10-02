const express = require('express');
const controller = require('../controllers/certificateController');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { ROLES } = require('../config/constants');
const { objectId, paginationRules } = require('../validators/common');

const router = express.Router();

// Public verification, no auth: anyone holding a code can confirm a certificate.
router.get('/verify/:code', controller.verifyCertificate);

router.use(protect);

router.get('/me', controller.listMyCertificates);
router.get('/instructor/issued', authorize(ROLES.INSTRUCTOR, ROLES.ADMIN), controller.listIssuedByMyCourses);
router.get('/', authorize(ROLES.ADMIN), validate(paginationRules), controller.adminListCertificates);

router.post(
  '/course/:courseId/claim',
  validate([objectId('courseId')]),
  controller.claimCertificate
);
router.get('/:id', validate([objectId('id')]), controller.getCertificate);

module.exports = router;
