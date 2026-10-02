const { body, query } = require('express-validator');
const { LEVELS, COURSE_STATUS } = require('../config/constants');
const { objectId, paginationRules, urlOrPath, boolish } = require('./common');

const arrayOfShortStrings = (field, max = 200) =>
  body(field)
    .optional()
    .isArray({ max: 30 })
    .withMessage(`"${field}" must be a list of up to 30 items`)
    .bail()
    .custom((items) => items.every((item) => typeof item === 'string' && item.trim().length <= max))
    .withMessage(`Each "${field}" entry must be text up to ${max} characters`);

/**
 * Built as a factory rather than by mutating a shared array, because
 * express-validator chains are stateful objects — reusing them across a
 * "required" and an "optional" rule set would leak `.optional()` into both.
 */
const courseFieldRules = ({ partial }) => {
  const required = (chain) => (partial ? chain.optional({ values: 'undefined' }) : chain);

  return [
    required(
      body('title')
        .trim()
        .notEmpty()
        .withMessage('Course title is required')
        .bail()
        .isLength({ min: 5, max: 140 })
        .withMessage('Title must be 5-140 characters')
    ),
    body('subtitle')
      .optional()
      .trim()
      .isLength({ max: 220 })
      .withMessage('Subtitle cannot exceed 220 characters'),
    required(
      body('description')
        .trim()
        .notEmpty()
        .withMessage('Course description is required')
        .bail()
        .isLength({ min: 20, max: 6000 })
        .withMessage('Description must be 20-6000 characters')
    ),
    required(
      body('category')
        .notEmpty()
        .withMessage('Please choose a category')
        .bail()
        .isMongoId()
        .withMessage('Invalid category')
    ),
    body('level').optional().isIn(LEVELS).withMessage(`Level must be one of: ${LEVELS.join(', ')}`),
    body('language').optional().trim().isLength({ max: 40 }),
    urlOrPath('thumbnail'),
    urlOrPath('promoVideoUrl'),
    boolish('isFree'),
    body('price')
      .optional()
      .isFloat({ min: 0, max: 1000000 })
      .withMessage('Price must be a positive number')
      .toFloat(),
    body('discountPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Discount price must be a positive number')
      .toFloat()
      .custom((value, { req }) => {
        if (!value) return true;
        return value <= Number(req.body.price ?? 0);
      })
      .withMessage('Discount price cannot exceed the full price'),
    body('currency')
      .optional()
      .isLength({ min: 3, max: 3 })
      .withMessage('Currency must be a 3-letter code'),
    arrayOfShortStrings('tags', 40),
    arrayOfShortStrings('whatYouWillLearn'),
    arrayOfShortStrings('requirements'),
    // A course marked paid must actually name a price.
    body('isFree')
      .custom((value, { req }) => {
        const isFree = value === undefined ? undefined : value === true || value === 'true';
        if (isFree !== false) return true;
        return Number(req.body.price ?? 0) > 0;
      })
      .withMessage('Paid courses need a price greater than 0'),
  ];
};

const createCourseRules = courseFieldRules({ partial: false });
const updateCourseRules = [objectId('id'), ...courseFieldRules({ partial: true })];

const listCourseRules = [
  ...paginationRules,
  query('search').optional().trim().isLength({ max: 120 }).withMessage('Search term is too long'),
  query('category').optional().isMongoId().withMessage('Invalid category filter'),
  query('level').optional().isIn(LEVELS).withMessage('Invalid level filter'),
  query('price')
    .optional()
    .isIn(['free', 'paid', 'all'])
    .withMessage('Price filter must be free, paid or all'),
  query('rating').optional().isFloat({ min: 0, max: 5 }).withMessage('Rating filter must be 0-5'),
  query('sort')
    .optional()
    .isIn(['newest', 'oldest', 'popular', 'rating', 'price-low', 'price-high', 'title'])
    .withMessage('Invalid sort option'),
  query('status')
    .optional()
    .isIn([...Object.values(COURSE_STATUS), 'all'])
    .withMessage('Invalid status filter'),
];

const rejectCourseRules = [
  objectId('id'),
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Tell the instructor why the course was rejected')
    .bail()
    .isLength({ min: 5, max: 600 })
    .withMessage('Reason must be 5-600 characters'),
];

const announcementRules = [
  objectId('id'),
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Announcement title is required')
    .isLength({ max: 140 }),
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Announcement message is required')
    .isLength({ max: 600 }),
];

module.exports = {
  createCourseRules,
  updateCourseRules,
  listCourseRules,
  rejectCourseRules,
  announcementRules,
};
