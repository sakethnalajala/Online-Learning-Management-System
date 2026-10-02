const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Option text is required'],
      trim: true,
      maxlength: [500, 'Option text cannot exceed 500 characters'],
    },
    isCorrect: { type: Boolean, default: false },
  },
  { _id: true }
);

const questionSchema = new mongoose.Schema(
  {
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
      index: true,
    },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', index: true },

    text: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
      minlength: [3, 'Question text must be at least 3 characters'],
      maxlength: [1200, 'Question text cannot exceed 1200 characters'],
    },
    type: {
      type: String,
      enum: ['single', 'multiple', 'boolean'],
      default: 'single',
    },
    options: {
      type: [optionSchema],
      validate: {
        validator: (options) => options.length >= 2,
        message: 'A question needs at least 2 options',
      },
    },
    explanation: { type: String, default: '', maxlength: 1200 },
    points: { type: Number, default: 1, min: [1, 'A question must be worth at least 1 point'] },
    order: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

questionSchema.index({ quiz: 1, order: 1 });

/** Every question must have at least one correct answer, and single-answer
 *  questions must have exactly one. */
questionSchema.pre('validate', function checkCorrectAnswers(next) {
  const correct = (this.options || []).filter((option) => option.isCorrect);
  if (correct.length === 0) {
    this.invalidate('options', 'Mark at least one option as the correct answer');
  } else if (this.type !== 'multiple' && correct.length > 1) {
    this.invalidate('options', 'A single-answer question can only have one correct option');
  }
  next();
});

/** Correct option ids, used by the grading service. */
questionSchema.methods.correctOptionIds = function correctOptionIds() {
  return this.options.filter((option) => option.isCorrect).map((option) => String(option._id));
};

module.exports = mongoose.model('Question', questionSchema);
