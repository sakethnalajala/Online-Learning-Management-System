const slugify = require('slugify');

const baseSlug = (value) => slugify(String(value || ''), { lower: true, strict: true, trim: true });

/**
 * Generates a slug that is unique within `Model`, appending -2, -3, … on clash.
 * `excludeId` lets a document keep its own slug while being renamed.
 */
async function uniqueSlug(Model, value, excludeId = null) {
  const base = baseSlug(value) || 'item';
  let slug = base;
  let suffix = 1;

  /* eslint-disable no-await-in-loop */
  while (true) {
    const query = { slug };
    if (excludeId) query._id = { $ne: excludeId };
    const clash = await Model.exists(query);
    if (!clash) return slug;
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
}

module.exports = { baseSlug, uniqueSlug };
