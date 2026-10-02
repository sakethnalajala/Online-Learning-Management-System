const mongoose = require('mongoose');
const { LESSON_TYPES } = require('../config/constants');

const lessonSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Lesson title is required'],
      trim: true,
      minlength: [3, 'Lesson title must be at least 3 characters'],
      maxlength: [160, 'Lesson title cannot exceed 160 characters'],
    },
    summary: { type: String, default: '', maxlength: 600 },

    /** Long-form lesson body. Rendered as rich text in the learning interface. */
    content: { type: String, default: '', maxlength: 40000 },

    type: { type: String, enum: LESSON_TYPES, default: 'video' },

    /** Primary video for the lesson, either a YouTube URL or an uploaded file path. */
    videoUrl: { type: String, default: '' },
    videoProvider: { type: String, enum: ['youtube', 'upload', 'external', 'none'], default: 'none' },

    durationMinutes: { type: Number, default: 5, min: [0, 'Duration cannot be negative'] },
    order: { type: Number, default: 0, index: true },

    /** Free lessons are viewable without enrolment (course trailer behaviour). */
    isPreview: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },

    resourceCount: { type: Number, default: 0, min: 0 },
    hasQuiz: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

lessonSchema.index({ module: 1, order: 1 });
lessonSchema.index({ course: 1, order: 1 });

lessonSchema.virtual('resources', {
  ref: 'Resource',
  localField: '_id',
  foreignField: 'lesson',
  options: { sort: { order: 1 } },
});

lessonSchema.virtual('quiz', {
  ref: 'Quiz',
  localField: '_id',
  foreignField: 'lesson',
  justOne: true,
});

module.exports = mongoose.model('Lesson', lessonSchema);
