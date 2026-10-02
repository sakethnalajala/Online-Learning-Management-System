const Category = require('../models/Category');
const Course = require('../models/Course');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok, created } = require('../utils/apiResponse');
const { uniqueSlug } = require('../utils/slug');
const { COURSE_STATUS } = require('../config/constants');

/**
 * GET /api/categories
 * Public. `?withCounts=true` adds the number of live courses in each category,
 * which is what the catalogue sidebar and landing page render.
 */
const listCategories = asyncHandler(async (req, res) => {
  const filter = {};
  // Only an admin has a reason to see deactivated categories.
  if (req.query.includeInactive !== 'true' || req.user?.role !== 'admin') filter.isActive = true;

  const categories = await Category.find(filter).sort({ name: 1 }).lean();

  if (req.query.withCounts !== 'true') return ok(res, categories, 'Categories.');

  const counts = await Course.aggregate([
    { $match: { status: COURSE_STATUS.PUBLISHED } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

  const withCounts = categories.map((category) => ({
    ...category,
    courseCount: countMap.get(String(category._id)) || 0,
  }));

  return ok(res, withCounts, 'Categories with course counts.');
});

/** GET /api/categories/:idOrSlug */
const getCategory = asyncHandler(async (req, res) => {
  const { idOrSlug } = req.params;
  const byId = /^[a-f\d]{24}$/i.test(idOrSlug);

  const category = await Category.findOne(byId ? { _id: idOrSlug } : { slug: idOrSlug }).lean();
  if (!category) throw ApiError.notFound('Category not found.');

  const courseCount = await Course.countDocuments({
    category: category._id,
    status: COURSE_STATUS.PUBLISHED,
  });

  return ok(res, { ...category, courseCount }, 'Category detail.');
});

/** POST /api/categories (admin) */
const createCategory = asyncHandler(async (req, res) => {
  const name = req.body.name.trim();

  if (await Category.exists({ name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') })) {
    throw ApiError.conflict('A category with that name already exists.');
  }

  const category = await Category.create({
    name,
    slug: await uniqueSlug(Category, name),
    description: req.body.description || '',
    icon: req.body.icon || 'BookOpen',
    color: req.body.color || '#8b5cf6',
    isActive: req.body.isActive !== false,
    createdBy: req.user._id,
  });

  return created(res, category, 'Category created.');
});

/** PATCH /api/categories/:id (admin) */
const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw ApiError.notFound('Category not found.');

  if (req.body.name && req.body.name.trim() !== category.name) {
    const name = req.body.name.trim();
    const clash = await Category.exists({
      _id: { $ne: category._id },
      name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
    });
    if (clash) throw ApiError.conflict('A category with that name already exists.');

    category.name = name;
    category.slug = await uniqueSlug(Category, name, category._id);
  }

  for (const field of ['description', 'icon', 'color', 'isActive']) {
    if (req.body[field] !== undefined) category[field] = req.body[field];
  }

  await category.save();
  return ok(res, category, 'Category updated.');
});

/**
 * DELETE /api/categories/:id (admin)
 * Refuses while courses still point at it — silently orphaning courses would
 * break the catalogue filter.
 */
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw ApiError.notFound('Category not found.');

  const inUse = await Course.countDocuments({ category: category._id });
  if (inUse > 0) {
    throw ApiError.conflict(
      `${inUse} course(s) use this category. Reassign them first, or deactivate the category instead.`
    );
  }

  await category.deleteOne();
  return ok(res, null, 'Category deleted.');
});

module.exports = {
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
};
