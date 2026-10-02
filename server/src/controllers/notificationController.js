const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok, paginated } = require('../utils/apiResponse');
const { getPagination } = require('../utils/pagination');

/** GET /api/notifications — the signed-in user's feed. */
const listMyNotifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, { defaultLimit: 20 });

  const filter = { user: req.user._id };
  if (req.query.unread === 'true') filter.isRead = false;
  if (req.query.type && req.query.type !== 'all') filter.type = req.query.type;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .populate('actor', 'name avatar')
      .populate('course', 'title slug thumbnail')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: req.user._id, isRead: false }),
  ]);

  return paginated(res, notifications, { page, limit, total, unreadCount }, 'Notifications.');
});

/** GET /api/notifications/unread-count — drives the navbar badge. */
const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ user: req.user._id, isRead: false });
  return ok(res, { count }, 'Unread notification count.');
});

/** PATCH /api/notifications/:id/read */
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) throw ApiError.notFound('Notification not found.');

  if (String(notification.user) !== String(req.user._id)) {
    throw ApiError.forbidden('You can only update your own notifications.');
  }

  if (!notification.isRead) {
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();
  }

  return ok(res, notification, 'Notification marked as read.');
});

/** PATCH /api/notifications/read-all */
const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    { user: req.user._id, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );

  return ok(res, { updated: result.modifiedCount }, 'All notifications marked as read.');
});

/** DELETE /api/notifications/:id */
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) throw ApiError.notFound('Notification not found.');

  if (String(notification.user) !== String(req.user._id)) {
    throw ApiError.forbidden('You can only delete your own notifications.');
  }

  await notification.deleteOne();
  return ok(res, null, 'Notification deleted.');
});

/** DELETE /api/notifications/read — clear the ones already seen. */
const clearRead = asyncHandler(async (req, res) => {
  const result = await Notification.deleteMany({ user: req.user._id, isRead: true });
  return ok(res, { deleted: result.deletedCount }, 'Read notifications cleared.');
});

module.exports = {
  listMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearRead,
};
