const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/**
 * Runs an express-validator chain array, then converts any failures into a
 * single 422 with a field → message map the frontend can render inline.
 */
const validate = (chains) => async (req, _res, next) => {
  await Promise.all(chains.map((chain) => chain.run(req)));

  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = {};
  for (const err of result.array()) {
    if (!errors[err.path]) errors[err.path] = err.msg;
  }

  return next(ApiError.unprocessable('Please correct the highlighted fields.', errors));
};

module.exports = validate;
