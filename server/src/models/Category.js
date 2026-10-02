const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
      maxlength: [60, 'Category name cannot exceed 60 characters'],
    },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: '', maxlength: 400 },
    icon: { type: String, default: 'BookOpen' }, // lucide-react icon name
    color: { type: String, default: '#8b5cf6' }, // violet-500
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

categorySchema.virtual('courseCount', {
  ref: 'Course',
  localField: '_id',
  foreignField: 'category',
  count: true,
});

module.exports = mongoose.model('Category', categorySchema);
