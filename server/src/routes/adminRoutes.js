const express = require('express');
const controller = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { ROLES } = require('../config/constants');

const router = express.Router();

// Every endpoint below is admin-only, enforced server-side.
router.use(protect, authorize(ROLES.ADMIN));

router.get('/stats', controller.getPlatformStats);
router.get('/pending-courses', controller.getPendingCourses);
router.get('/activity', controller.getRecentActivity);

module.exports = router;
