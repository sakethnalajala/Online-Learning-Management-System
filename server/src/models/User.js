const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const env = require('../config/env');
const { ROLES, USER_STATUS } = require('../config/constants');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [80, 'Name cannot exceed 80 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // never leaves the DB layer unless explicitly requested
    },
    role: {
      type: String,
      enum: { values: Object.values(ROLES), message: '{VALUE} is not a valid role' },
      default: ROLES.STUDENT,
      index: true,
    },
    status: { type: String, enum: USER_STATUS, default: 'active', index: true },

    avatar: { type: String, default: '' },
    bio: { type: String, default: '', maxlength: [600, 'Bio cannot exceed 600 characters'] },
    headline: {
      type: String,
      default: '',
      maxlength: [120, 'Headline cannot exceed 120 characters'],
    },
    phone: { type: String, default: '', maxlength: 24 },
    website: { type: String, default: '' },
    expertise: [{ type: String, trim: true }],
    social: {
      linkedin: { type: String, default: '' },
      github: { type: String, default: '' },
      twitter: { type: String, default: '' },
    },

    isDemo: { type: Boolean, default: false },
    lastLoginAt: { type: Date },
    passwordChangedAt: { type: Date, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.password;
        delete ret.passwordChangedAt;
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

userSchema.index({ name: 'text', email: 'text' });

userSchema.virtual('courses', {
  ref: 'Course',
  localField: '_id',
  foreignField: 'instructor',
});

userSchema.virtual('enrollments', {
  ref: 'Enrollment',
  localField: '_id',
  foreignField: 'student',
});

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, env.saltRounds);
  // Back-date by 1s so a token minted in the same tick is not invalidated.
  if (!this.isNew) this.passwordChangedAt = new Date(Date.now() - 1000);
  return next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.passwordChangedAfter = function passwordChangedAfter(jwtIssuedAtSeconds) {
  if (!this.passwordChangedAt) return false;
  return Math.floor(this.passwordChangedAt.getTime() / 1000) > jwtIssuedAtSeconds;
};

module.exports = mongoose.model('User', userSchema);
