const express = require('express');
const controller = require('../controllers/resourceController');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { ROLES } = require('../config/constants');
const rules = require('../validators/contentValidators');
const { objectId } = require('../validators/common');

const router = express.Router();

router.use(protect);

const instructorOrAdmin = authorize(ROLES.INSTRUCTOR, ROLES.ADMIN);

// Platform-wide resource management for admins.
router.get('/admin/all', authorize(ROLES.ADMIN), controller.adminListResources);

router.get('/:id', validate([objectId('id')]), controller.getResource);
router.patch(
  '/:id',
  instructorOrAdmin,
  validate([objectId('id'), ...rules.resourceRules(true)]),
  controller.updateResource
);
router.delete('/:id', instructorOrAdmin, validate([objectId('id')]), controller.deleteResource);

module.exports = router;
