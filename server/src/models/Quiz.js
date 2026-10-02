const mongoose = require('mongoose');

/** One quiz per lesson. Questions live in their own collection. */
const quizSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Quiz title is required'],
      trim: true,
      maxlength: [160, 'Quiz title cannot exceed 160 characters'],
    },
    description: { type: String, default: '', maxlength: 800 },

    passingScore: {
      type: Number,
      default: 60,
      min: [0, 'Passing score cannot be negative'],
      max: [100, 'Passing score cannot exceed 100'],
    },
    timeLimitMinutes: { type: Number, default: 0, min: 0 }, // 0 = untimed
    maxAttempts: { type: Number, default: 0, min: 0 }, // 0 = unlimited
    shuffleQuestions: { type: Boolean, default: false },
    showAnswersAfterSubmit: { type: Boolean, default: true },

    /** When true, passing the quiz is required before the lesson counts complete. */
    isRequiredForCompletion: { type: Boolean, default: false },

    isPublished: { type: Boolean, default: true },
    questionCount: { type: Number, default: 0, min: 0 },
    totalPoints: { type: Number, default: 0, min: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

quizSchema.virtual('questions', {
  ref: 'Question',
  localField: '_id',
  foreignField: 'quiz',
  options: { sort: { order: 1 } },
});

module.exports = mongoose.model('Quiz', quizSchema);
