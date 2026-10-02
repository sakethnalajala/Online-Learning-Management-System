const multer = require('multer');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');

/** Mongoose/Mongo/JWT/Multer failures → predictable ApiError instances. */
function normalize(err) {
  if (err instanceof ApiError) return err;

  if (err.name === 'CastError') {
    return ApiError.badRequest(`Invalid ${err.path}: "${err.value}" is not a valid identifier.`);
  }

  if (err.name === 'ValidationError') {
    const details = {};
    for (const [field, e] of Object.entries(err.errors)) details[field] = e.message;
    return ApiError.unprocessable('Please correct the highlighted fields.', details);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || { field: 1 })[0];
    return ApiError.conflict(`A record with that ${field} already exists.`);
  }

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return ApiError.badRequest(`File too large. Maximum allowed size is ${env.maxUploadMb}MB.`);
    }
    return ApiError.badRequest(`Upload failed: ${err.message}`);
  }

  if (err.name === 'JsonWebTokenError') return ApiError.unauthorized('Invalid authentication token.');
  if (err.name === 'TokenExpiredError') return ApiError.unauthorized('Session expired. Please log in again.');

  if (err.type === 'entity.parse.failed') return ApiError.badRequest('Malformed JSON in request body.');

  return null; // unknown → programmer error
}

// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
  const known = normalize(err);
  const statusCode = known ? known.statusCode : err.statusCode || 500;

  if (!known || statusCode >= 500) {
    console.error('[error]', req.method, req.originalUrl, '\n', err);
  }

  const body = {
    success: false,
    message: known
      ? known.message
      : env.isProd
        ? 'Something went wrong on our end. Please try again.'
        : err.message || 'Internal server error',
  };

  if (known?.details) body.errors = known.details;
  if (!env.isProd && !known) body.stack = err.stack;

  res.status(statusCode).json(body);
};
