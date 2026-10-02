const ApiError = require('../utils/ApiError');
const { ROLES } = require('../config/constants');

/**
 * Role gate. Always used *after* `protect`.
 *   router.post('/', protect, authorize(ROLES.INSTRUCTOR, ROLES.ADMIN), handler)
 */
const authorize =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(`Access denied. This action requires role: ${roles.join(' or ')}.`)
      );
    }
    next();
  };

/**
 * Ownership gate for instructor-scoped resources.
 * Admins bypass it — they have platform-wide access by design.
 */
const ensureOwnerOrAdmin = (ownerId, user, label = 'resource') => {
  if (user.role === ROLES.ADMIN) return;
  if (String(ownerId) !== String(user._id)) {
    throw ApiError.forbidden(`You can only manage your own ${label}.`);
  }
};

module.exports = { authorize, ensureOwnerOrAdmin };
