const express = require('express');
const controller = require('../controllers/userController');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { upload } = require('../middleware/upload');
const { ROLES } = require('../config/constants');
const rules = require('../validators/userValidators');
const { objectId } = require('../validators/common');

const router = express.Router();

// Public instructor profile.
router.get('/instructors/:id', validate([objectId('id')]), controller.getInstructorProfile);

router.use(protect);

router.get('/me', controller.getMyProfile);
router.patch('/me', validate(rules.updateProfileRules), controller.updateMyProfile);
router.post('/me/avatar', upload.single('avatar'), controller.uploadAvatar);
router.get('/me/stats', controller.getMyStats);

// Admin user management.
router.get('/', authorize(ROLES.ADMIN), validate(rules.listUsersRules), controller.listUsers);
router.get('/:id', authorize(ROLES.ADMIN), validate([objectId('id')]), controller.getUser);
router.patch('/:id', authorize(ROLES.ADMIN), validate(rules.adminUpdateUserRules), controller.updateUser);
router.delete('/:id', authorize(ROLES.ADMIN), validate([objectId('id')]), controller.deleteUser);

module.exports = router;
