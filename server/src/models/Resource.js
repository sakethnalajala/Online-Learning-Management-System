const mongoose = require('mongoose');
const { RESOURCE_TYPES } = require('../config/constants');

/**
 * A single piece of learning material attached to a lesson.
 * `type` decides which of url / textContent / file metadata is meaningful:
 *   youtube | video | pdf | document | image | link  -> url
 *   text                                             -> textContent
 */
const resourceSchema = new mongoose.Schema(
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
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Resource title is required'],
      trim: true,
      maxlength: [160, 'Resource title cannot exceed 160 characters'],
    },
    description: { type: String, default: '', maxlength: 600 },
    type: {
      type: String,
      enum: { values: RESOURCE_TYPES, message: '{VALUE} is not a supported resource type' },
      required: [true, 'Resource type is required'],
    },

    url: { type: String, default: '' },
    textContent: { type: String, default: '', maxlength: 20000 },

    // Populated when the resource came from an upload rather than a URL.
    fileName: { type: String, default: '' },
    fileSize: { type: Number, default: 0 },
    mimeType: { type: String, default: '' },
    isUploaded: { type: Boolean, default: false },

    order: { type: Number, default: 0 },
    isDownloadable: { type: Boolean, default: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

resourceSchema.index({ lesson: 1, order: 1 });

/** A URL-less, text-less resource is not usable content. */
resourceSchema.pre('validate', function requirePayload(next) {
  if (this.type === 'text') {
    if (!this.textContent || !this.textContent.trim()) {
      this.invalidate('textContent', 'Text resources require content');
    }
  } else if (!this.url || !this.url.trim()) {
    this.invalidate('url', `A ${this.type} resource requires a URL or an uploaded file`);
  }
  next();
});

module.exports = mongoose.model('Resource', resourceSchema);
