const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok, created } = require('../utils/apiResponse');
const { issueTokens, verifyRefreshToken } = require('../utils/token');
const { ROLES } = require('../config/constants');
const env = require('../config/env');
const notifications = require('../services/notificationService');
const { NOTIFICATION_TYPES } = require('../config/constants');

const cookieOptions = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: env.isProd ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

/** Shape sent to the client on any successful auth call. */
const authPayload = (user, tokens) => ({
  user: {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    avatar: user.avatar,
    headline: user.headline,
    bio: user.bio,
    isDemo: user.isDemo,
    createdAt: user.createdAt,
  },
  ...tokens,
});

/** POST /api/auth/register */
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Admin is never self-assignable — it is granted by an existing admin only.
  const requested = req.body.role;
  const role = requested === ROLES.INSTRUCTOR ? ROLES.INSTRUCTOR : ROLES.STUDENT;

  if (await User.exists({ email: email.toLowerCase() })) {
    throw ApiError.conflict('An account with that email already exists.');
  }

  const user = await User.create({ name, email, password, role });

  await notifications.notify({
    user: user._id,
    type: NOTIFICATION_TYPES.SYSTEM,
    title: `Welcome to Lumina, ${user.name.split(' ')[0]}`,
    message:
      role === ROLES.INSTRUCTOR
        ? 'Your instructor account is ready. Create your first course to get started.'
        : 'Your account is ready. Browse the catalogue and enrol in your first course.',
    link: role === ROLES.INSTRUCTOR ? '/instructor' : '/courses',
  });

  const tokens = issueTokens(user);
  res.cookie('accessToken', tokens.accessToken, cookieOptions);

  return created(res, authPayload(user, tokens), 'Account created successfully.');
});

/** POST /api/auth/login */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password');

  // Same message for "no such user" and "wrong password" so the endpoint
  // cannot be used to enumerate registered email addresses.
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password.');
  }

  if (user.status === 'suspended') {
    throw ApiError.forbidden('Your account has been suspended. Please contact support.');
  }

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const tokens = issueTokens(user);
  res.cookie('accessToken', tokens.accessToken, cookieOptions);

  return ok(res, authPayload(user, tokens), `Welcome back, ${user.name.split(' ')[0]}.`);
});

/** GET /api/auth/me */
const me = asyncHandler(async (req, res) => ok(res, { user: req.user }, 'Current session.'));

/** POST /api/auth/logout — clears the cookie; the client discards its tokens. */
const logout = asyncHandler(async (_req, res) => {
  res.clearCookie('accessToken', { ...cookieOptions, maxAge: undefined });
  return ok(res, null, 'Logged out successfully.');
});

/** POST /api/auth/refresh */
const refresh = asyncHandler(async (req, res) => {
  const token = req.body.refreshToken || req.cookies?.refreshToken;
  if (!token) throw ApiError.unauthorized('No refresh token supplied.');

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token.');
  }

  const user = await User.findById(payload.sub);
  if (!user) throw ApiError.unauthorized('The account for this token no longer exists.');
  if (user.status === 'suspended') throw ApiError.forbidden('Your account has been suspended.');

  const tokens = issueTokens(user);
  res.cookie('accessToken', tokens.accessToken, cookieOptions);

  return ok(res, authPayload(user, tokens), 'Session refreshed.');
});

/** PATCH /api/auth/password */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    throw ApiError.unauthorized('Your current password is incorrect.');
  }

  user.password = newPassword;
  await user.save();

  // Old tokens are invalidated by passwordChangedAt, so re-issue immediately.
  const tokens = issueTokens(user);
  res.cookie('accessToken', tokens.accessToken, cookieOptions);

  return ok(res, tokens, 'Password updated successfully.');
});

/**
 * GET /api/auth/demo-accounts
 * Powers the credential panel on the login screen. Returns only accounts that
 * were created by the seeder and really exist, never a hardcoded list.
 */
const demoAccounts = asyncHandler(async (req, res) => {
  const filter = { isDemo: true };
  // `?role=student` powers the role-specific login screens.
  if (req.query.role && Object.values(ROLES).includes(req.query.role)) {
    filter.role = req.query.role;
  }

  const users = await User.find(filter).select('name email role headline').lean();

  // Each role has its own password; the seeder writes exactly these values.
  const accounts = users
    .map((user) => ({
      name: user.name,
      email: user.email,
      role: user.role,
      headline: user.headline || '',
      password: env.demoPasswords[user.role] || '',
    }))
    .sort((a, b) => {
      const order = [ROLES.STUDENT, ROLES.INSTRUCTOR, ROLES.ADMIN];
      return order.indexOf(a.role) - order.indexOf(b.role);
    });

  return ok(res, accounts, 'Demo accounts.');
});

module.exports = { register, login, me, logout, refresh, changePassword, demoAccounts };
