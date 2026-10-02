const mongoose = require('mongoose');

/** A course section. Owns an ordered list of lessons. */
const moduleSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Module title is required'],
      trim: true,
      minlength: [3, 'Module title must be at least 3 characters'],
      maxlength: [140, 'Module title cannot exceed 140 characters'],
    },
    description: { type: String, default: '', maxlength: 1000 },
    order: { type: Number, default: 0, index: true },
    isPublished: { type: Boolean, default: true },
    lessonCount: { type: Number, default: 0, min: 0 },
    durationMinutes: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

moduleSchema.index({ course: 1, order: 1 });

moduleSchema.virtual('lessons', {
  ref: 'Lesson',
  localField: '_id',
  foreignField: 'module',
  options: { sort: { order: 1 } },
});

module.exports = mongoose.model('Module', moduleSchema);
