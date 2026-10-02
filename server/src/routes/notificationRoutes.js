const express = require('express');
const controller = require('../controllers/notificationController');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { paginationRules, objectId } = require('../validators/common');

const router = express.Router();

router.use(protect);

router.get('/', validate(paginationRules), controller.listMyNotifications);
router.get('/unread-count', controller.getUnreadCount);
router.patch('/read-all', controller.markAllAsRead);
router.delete('/read', controller.clearRead);
router.patch('/:id/read', validate([objectId('id')]), controller.markAsRead);
router.delete('/:id', validate([objectId('id')]), controller.deleteNotification);

module.exports = router;
