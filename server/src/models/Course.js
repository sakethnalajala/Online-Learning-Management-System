const mongoose = require('mongoose');
const { COURSE_STATUS, LEVELS } = require('../config/constants');

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [140, 'Title cannot exceed 140 characters'],
    },
    slug: { type: String, required: true, unique: true, index: true },
    subtitle: {
      type: String,
      default: '',
      maxlength: [220, 'Subtitle cannot exceed 220 characters'],
    },
    description: {
      type: String,
      required: [true, 'Course description is required'],
      minlength: [20, 'Description must be at least 20 characters'],
      maxlength: [6000, 'Description cannot exceed 6000 characters'],
    },
    thumbnail: { type: String, default: '' },
    promoVideoUrl: { type: String, default: '' },

    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Please choose a category'],
      index: true,
    },

    level: { type: String, enum: LEVELS, default: 'beginner', index: true },
    language: { type: String, default: 'English' },
    tags: [{ type: String, trim: true, lowercase: true }],
    whatYouWillLearn: [{ type: String, trim: true, maxlength: 200 }],
    requirements: [{ type: String, trim: true, maxlength: 200 }],

    // Pricing.
    // No payment gateway is wired up. Courses with isFree=false record an
    // intended price, and paid enrollment is gated in the enrollment service
    // until a real payment provider is integrated.
    isFree: { type: Boolean, default: true, index: true },
    price: { type: Number, default: 0, min: [0, 'Price cannot be negative'] },
    discountPrice: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'INR' },

    // Lifecycle: draft -> pending -> approved -> published/unpublished, or rejected.
    status: {
      type: String,
      enum: Object.values(COURSE_STATUS),
      default: COURSE_STATUS.DRAFT,
      index: true,
    },
    submittedAt: { type: Date },
    reviewedAt: { type: Date },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String, default: '' },
    publishedAt: { type: Date },

    // Denormalised counters, kept in sync by the service layer.
    enrollmentCount: { type: Number, default: 0, min: 0 },
    lessonCount: { type: Number, default: 0, min: 0 },
    moduleCount: { type: Number, default: 0, min: 0 },
    totalDurationMinutes: { type: Number, default: 0, min: 0 },
    ratingAverage: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },

    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

courseSchema.index({ title: 'text', subtitle: 'text', description: 'text', tags: 'text' });
courseSchema.index({ status: 1, createdAt: -1 });
courseSchema.index({ instructor: 1, status: 1 });

courseSchema.virtual('modules', {
  ref: 'Module',
  localField: '_id',
  foreignField: 'course',
  options: { sort: { order: 1 } },
});

courseSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'course',
});

/** Students can only discover and enrol in courses that are published. */
courseSchema.virtual('isLive').get(function isLive() {
  return this.status === COURSE_STATUS.PUBLISHED;
});

courseSchema.virtual('effectivePrice').get(function effectivePrice() {
  if (this.isFree) return 0;
  return this.discountPrice > 0 ? this.discountPrice : this.price;
});

module.exports = mongoose.model('Course', courseSchema);
