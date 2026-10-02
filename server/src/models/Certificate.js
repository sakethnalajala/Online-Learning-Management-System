const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    /** Public, shareable id printed on the certificate. */
    certificateId: { type: String, required: true, unique: true, index: true },

    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    enrollment: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment', required: true },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Snapshotted at issue time so a later course rename does not rewrite history.
    studentName: { type: String, required: true },
    courseTitle: { type: String, required: true },
    instructorName: { type: String, default: '' },

    issuedAt: { type: Date, default: Date.now },
    completionPercentage: { type: Number, default: 100 },
    totalLessons: { type: Number, default: 0 },
    averageQuizScore: { type: Number, default: 0 },
    hoursOfContent: { type: Number, default: 0 },

    /** Used by the public verification lookup. */
    verificationCode: { type: String, required: true, index: true },
    isRevoked: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// One certificate per student per course.
certificateSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Certificate', certificateSchema);
