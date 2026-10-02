const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    /** Option ids the student picked. Always an array, even for single-answer. */
    selectedOptionIds: [{ type: mongoose.Schema.Types.ObjectId }],
    isCorrect: { type: Boolean, default: false },
    pointsAwarded: { type: Number, default: 0 },
  },
  { _id: false }
);

/** A graded submission. Immutable once created; retakes create new attempts. */
const quizAttemptSchema = new mongoose.Schema(
  {
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    enrollment: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment' },

    answers: [answerSchema],

    attemptNumber: { type: Number, default: 1, min: 1 },
    score: { type: Number, default: 0, min: 0 }, // percentage, 0-100
    pointsEarned: { type: Number, default: 0, min: 0 },
    totalPoints: { type: Number, default: 0, min: 0 },
    correctCount: { type: Number, default: 0, min: 0 },
    questionCount: { type: Number, default: 0, min: 0 },
    passed: { type: Boolean, default: false, index: true },
    passingScore: { type: Number, default: 60 },

    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date, default: Date.now },
    timeSpentSeconds: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

quizAttemptSchema.index({ student: 1, quiz: 1, attemptNumber: -1 });
quizAttemptSchema.index({ course: 1, student: 1 });

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
