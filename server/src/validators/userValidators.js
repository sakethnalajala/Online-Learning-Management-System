const { body } = require('express-validator');
const { ROLES, USER_STATUS } = require('../config/constants');
const { objectId, urlOrPath, paginationRules } = require('./common');

const updateProfileRules = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage('Name must be 2-80 characters'),
  body('headline').optional().trim().isLength({ max: 120 }).withMessage('Headline cannot exceed 120 characters'),
  body('bio').optional().trim().isLength({ max: 600 }).withMessage('Bio cannot exceed 600 characters'),
  body('phone')
    .optional({ values: 'falsy' })
    .trim()
    .matches(/^[+\d][\d\s()-]{6,23}$/)
    .withMessage('Enter a valid phone number'),
  urlOrPath('avatar'),
  urlOrPath('website'),
  body('expertise')
    .optional()
    .isArray({ max: 20 })
    .withMessage('Expertise must be a list of up to 20 items'),
  urlOrPath('social.linkedin'),
  urlOrPath('social.github'),
  urlOrPath('social.twitter'),
  // Role and status are admin-only; ignore them if a client tries.
  body('role').not().exists().withMessage('Role cannot be changed from the profile endpoint'),
  body('status').not().exists().withMessage('Status cannot be changed from the profile endpoint'),
];

const adminUpdateUserRules = [
  objectId('id'),
  body('name').optional().trim().isLength({ min: 2, max: 80 }),
  body('role').optional().isIn(Object.values(ROLES)).withMessage('Invalid role'),
  body('status').optional().isIn(USER_STATUS).withMessage('Status must be active or suspended'),
];

const listUsersRules = [...paginationRules];

const reviewRules = (partial = false) => {
  const required = (chain) => (partial ? chain.optional({ values: 'undefined' }) : chain);
  return [
    required(
      body('rating')
        .notEmpty()
        .withMessage('A rating is required')
        .bail()
        .isInt({ min: 1, max: 5 })
        .withMessage('Rating must be a whole number between 1 and 5')
        .toInt()
    ),
    body('title').optional().trim().isLength({ max: 120 }).withMessage('Title cannot exceed 120 characters'),
    body('comment')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Review cannot exceed 2000 characters'),
  ];
};

module.exports = { updateProfileRules, adminUpdateUserRules, listUsersRules, reviewRules };
