const mongoose = require('mongoose');
const { NOTIFICATION_TYPES } = require('../config/constants');

const notificationSchema = new mongoose.Schema(
  {
    /** Recipient. Notifications are always addressed to exactly one user. */
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPES),
      required: true,
      index: true,
    },
    title: { type: String, required: true, maxlength: 160 },
    message: { type: String, default: '', maxlength: 600 },

    /** In-app route the notification links to, e.g. /student/courses/<slug>. */
    link: { type: String, default: '' },

    // Optional back-references for context and cleanup.
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
