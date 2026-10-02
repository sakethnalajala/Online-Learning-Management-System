const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { verifyAccessToken } = require('../utils/token');
const User = require('../models/User');

const extractToken = (req) => {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  if (req.cookies?.accessToken) return req.cookies.accessToken;
  return null;
};

/**
 * Hard gate: requires a valid access token AND a live, non-suspended user.
 * The DB lookup is deliberate — a token issued before a ban must stop working.
 */
const protect = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) throw ApiError.unauthorized('Not authenticated. Please log in.');

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    const msg = err.name === 'TokenExpiredError' ? 'Session expired. Please log in again.' : 'Invalid authentication token.';
    throw ApiError.unauthorized(msg);
  }

  const user = await User.findById(payload.sub).select('+passwordChangedAt');
  if (!user) throw ApiError.unauthorized('The account for this token no longer exists.');
  if (user.status === 'suspended') throw ApiError.forbidden('Your account has been suspended.');
  if (user.passwordChangedAfter(payload.iat)) {
    throw ApiError.unauthorized('Password was changed recently. Please log in again.');
  }

  req.user = user;
  next();
});

/** Soft gate: attaches req.user when a token is present, never rejects. */
const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);
    if (user && user.status !== 'suspended') req.user = user;
  } catch {
    /* ignore — this route works for guests too */
  }
  next();
});

module.exports = { protect, optionalAuth, extractToken };
