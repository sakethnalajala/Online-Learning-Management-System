const express = require('express');
const controller = require('../controllers/categoryController');
const validate = require('../middleware/validate');
const { protect, optionalAuth } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { ROLES } = require('../config/constants');
const rules = require('../validators/contentValidators');
const { objectId } = require('../validators/common');

const router = express.Router();

router.get('/', optionalAuth, controller.listCategories);
router.get('/:idOrSlug', controller.getCategory);

router.post(
  '/',
  protect,
  authorize(ROLES.ADMIN),
  validate(rules.categoryRules(false)),
  controller.createCategory
);
router.patch(
  '/:id',
  protect,
  authorize(ROLES.ADMIN),
  validate([objectId('id'), ...rules.categoryRules(true)]),
  controller.updateCategory
);
router.delete(
  '/:id',
  protect,
  authorize(ROLES.ADMIN),
  validate([objectId('id')]),
  controller.deleteCategory
);

module.exports = router;
