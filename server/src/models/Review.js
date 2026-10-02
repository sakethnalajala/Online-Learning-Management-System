const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: [true, 'A rating is required'],
      min: [1, 'Rating must be between 1 and 5'],
      max: [5, 'Rating must be between 1 and 5'],
    },
    title: { type: String, default: '', trim: true, maxlength: [120, 'Title cannot exceed 120 characters'] },
    comment: {
      type: String,
      default: '',
      trim: true,
      maxlength: [2000, 'Review cannot exceed 2000 characters'],
    },
    isEdited: { type: Boolean, default: false },
    helpfulCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Business rule: one review per student per course. Editing replaces it.
reviewSchema.index({ course: 1, student: 1 }, { unique: true });
reviewSchema.index({ course: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
