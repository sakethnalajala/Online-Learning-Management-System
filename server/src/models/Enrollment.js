const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema(
  {
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
    // Denormalised so instructor dashboards can filter without a course join.
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },

    enrolledAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled'],
      default: 'active',
      index: true,
    },

    /**
     * Access record for the enrolment. Free courses are granted immediately.
     * Paid courses are recorded as `pending_payment` unless an admin grants
     * access, because no payment provider is integrated in this build.
     */
    accessType: {
      type: String,
      enum: ['free', 'paid', 'granted'],
      default: 'free',
    },
    paymentStatus: {
      type: String,
      enum: ['not_required', 'pending_payment', 'paid', 'waived'],
      default: 'not_required',
    },
    amountPaid: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'INR' },

    completedAt: { type: Date },
    certificate: { type: mongoose.Schema.Types.ObjectId, ref: 'Certificate' },
    lastAccessedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// The database itself refuses a duplicate enrolment; the controller also checks
// first so the user gets a friendly 409 rather than a raw duplicate-key error.
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });
enrollmentSchema.index({ student: 1, status: 1 });

enrollmentSchema.virtual('progress', {
  ref: 'Progress',
  localField: '_id',
  foreignField: 'enrollment',
  justOne: true,
});

module.exports = mongoose.model('Enrollment', enrollmentSchema);
