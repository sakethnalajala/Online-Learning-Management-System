const { body, query } = require('express-validator');
const { LEVELS, COURSE_STATUS } = require('../config/constants');
const { objectId, paginationRules, urlOrPath } = require('./common');

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
    /*
     * Every course on this platform is free. Rather than validating a price,
     * the API refuses one outright: a request that tries to mark a course paid
     * or attach a non-zero amount is rejected, so no paid course can be created
     * through the API even if a client is modified to send one.
     */
    body('isFree')
      .optional()
      .custom((value) => value === true || value === 'true')
      .withMessage('All courses are free; isFree cannot be false'),
    body('price')
      .optional()
      .custom((value) => Number(value) === 0)
      .withMessage('All courses are free; price must be 0'),
    body('discountPrice')
      .optional()
      .custom((value) => Number(value) === 0)
      .withMessage('All courses are free; discountPrice must be 0'),
    body('currency')
      .optional()
      .isLength({ min: 3, max: 3 })
      .withMessage('Currency must be a 3-letter code'),
    arrayOfShortStrings('tags', 40),
    arrayOfShortStrings('whatYouWillLearn'),
    arrayOfShortStrings('requirements'),
  ];
};

const createCourseRules = courseFieldRules({ partial: false });
const updateCourseRules = [objectId('id'), ...courseFieldRules({ partial: true })];

const listCourseRules = [
  ...paginationRules,
  query('search').optional().trim().isLength({ max: 120 }).withMessage('Search term is too long'),
  query('category').optional().isMongoId().withMessage('Invalid category filter'),
  query('level').optional().isIn(LEVELS).withMessage('Invalid level filter'),
  query('rating').optional().isFloat({ min: 0, max: 5 }).withMessage('Rating filter must be 0-5'),
  query('sort')
    .optional()
    .isIn(['newest', 'oldest', 'popular', 'rating', 'title'])
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
