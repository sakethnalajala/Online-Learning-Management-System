const { body, param, query } = require('express-validator');

/** Reusable ObjectId check for route params. */
const objectId = (name, location = param) =>
  location(name).isMongoId().withMessage(`"${name}" must be a valid id`);

const optionalObjectId = (name, location = body) =>
  location(name).optional({ values: 'falsy' }).isMongoId().withMessage(`"${name}" must be a valid id`);

const paginationRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be 1 or greater').toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
];

const strongPassword = (field = 'password') =>
  body(field)
    .isLength({ min: 8, max: 72 })
    .withMessage('Password must be 8-72 characters')
    .matches(/[a-z]/)
    .withMessage('Password must include a lowercase letter')
    .matches(/[A-Z]/)
    .withMessage('Password must include an uppercase letter')
    .matches(/\d/)
    .withMessage('Password must include a number');

/** Accepts a real URL or an app-relative upload path such as /uploads/x.pdf. */
const urlOrPath = (field, { optional = true } = {}) => {
  const chain = optional ? body(field).optional({ values: 'falsy' }) : body(field);
  return chain
    .trim()
    .custom((value) => {
      if (!value) return true;
      if (value.startsWith('/')) return true;
      return /^https?:\/\/.+/i.test(value);
    })
    .withMessage(`"${field}" must be a valid http(s) URL or an uploaded file path`);
};

const boolish = (field) =>
  body(field).optional().isBoolean().withMessage(`"${field}" must be true or false`).toBoolean();

module.exports = {
  objectId,
  optionalObjectId,
  paginationRules,
  strongPassword,
  urlOrPath,
  boolish,
};
