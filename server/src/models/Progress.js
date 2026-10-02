const mongoose = require('mongoose');

const completedLessonSchema = new mongoose.Schema(
  {
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
    module: { type: mongoose.Schema.Types.ObjectId, ref: 'Module' },
    completedAt: { type: Date, default: Date.now },
    watchedSeconds: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

/**
 * One document per enrolment. This is the single source of truth for
 * "how far has this student got", and the certificate/completion flow reads it.
 */
const progressSchema = new mongoose.Schema(
  {
    enrollment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Enrollment',
      required: true,
      unique: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },

    completedLessons: [completedLessonSchema],

    /** Total publishable lessons at the time of the last recalculation. */
    totalLessons: { type: Number, default: 0, min: 0 },
    percentage: { type: Number, default: 0, min: 0, max: 100 },

    // "Continue learning" resume point.
    lastLesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
    lastModule: { type: mongoose.Schema.Types.ObjectId, ref: 'Module' },
    lastAccessedAt: { type: Date, default: Date.now },

    isCompleted: { type: Boolean, default: false, index: true },
    completedAt: { type: Date },
    startedAt: { type: Date, default: Date.now },

    totalWatchedMinutes: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

progressSchema.index({ student: 1, course: 1 }, { unique: true });

progressSchema.virtual('completedCount').get(function completedCount() {
  return this.completedLessons.length;
});

progressSchema.virtual('remainingCount').get(function remainingCount() {
  return Math.max(0, this.totalLessons - this.completedLessons.length);
});

progressSchema.methods.hasCompleted = function hasCompleted(lessonId) {
  return this.completedLessons.some((entry) => String(entry.lesson) === String(lessonId));
};

module.exports = mongoose.model('Progress', progressSchema);
