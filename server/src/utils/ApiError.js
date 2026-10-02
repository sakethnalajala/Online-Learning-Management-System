/**
 * Operational (expected) error carrying an HTTP status code.
 * Anything thrown that is NOT an ApiError is treated as a programmer error
 * by the global error handler and its message is hidden in production.
 */
class ApiError extends Error {
  constructor(statusCode, message, details = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    if (details) this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(msg = 'Bad request', details) {
    return new ApiError(400, msg, details);
  }
  static unauthorized(msg = 'Authentication required') {
    return new ApiError(401, msg);
  }
  static forbidden(msg = 'You do not have permission to perform this action') {
    return new ApiError(403, msg);
  }
  static notFound(msg = 'Resource not found') {
    return new ApiError(404, msg);
  }
  static conflict(msg = 'Resource already exists') {
    return new ApiError(409, msg);
  }
  static unprocessable(msg = 'Validation failed', details) {
    return new ApiError(422, msg, details);
  }
  static tooMany(msg = 'Too many requests') {
    return new ApiError(429, msg);
  }
  static internal(msg = 'Something went wrong') {
    return new ApiError(500, msg);
  }
}

module.exports = ApiError;
