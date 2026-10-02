const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok, paginated } = require('../utils/apiResponse');
const { getPagination } = require('../utils/pagination');
const { ROLES, COURSE_STATUS } = require('../config/constants');
const { publicUrl } = require('../middleware/upload');

/** Fields a user is allowed to change about themselves. */
const PROFILE_FIELDS = [
  'name',
  'headline',
  'bio',
  'phone',
  'website',
  'avatar',
  'expertise',
  'social',
];

/** GET /api/users/me */
const getMyProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  return ok(res, user, 'Your profile.');
});

/** PATCH /api/users/me */
const updateMyProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('User not found.');

  for (const field of PROFILE_FIELDS) {
    if (req.body[field] === undefined) continue;
    if (field === 'social') {
      user.social = { ...user.social.toObject?.() ?? user.social, ...req.body.social };
    } else {
      user[field] = req.body[field];
    }
  }

  await user.save();
  return ok(res, user, 'Profile updated.');
});

/** POST /api/users/me/avatar */
const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('Please attach an image file.');
  if (!req.file.mimetype.startsWith('image/')) {
    throw ApiError.badRequest('Avatars must be an image file.');
  }

  const user = await User.findById(req.user._id);
  user.avatar = publicUrl(req.file);
  await user.save();

  return ok(res, { avatar: user.avatar }, 'Avatar updated.');
});

/**
 * GET /api/users/me/stats
 * One request that powers whichever dashboard header the caller's role needs.
 */
const getMyStats = asyncHandler(async (req, res) => {
  const { _id, role } = req.user;

  if (role === ROLES.INSTRUCTOR) {
    const courses = await Course.find({ instructor: _id }).select('status enrollmentCount ratingAverage ratingCount').lean();
    const enrollments = await Enrollment.countDocuments({ instructor: _id, status: { $ne: 'cancelled' } });
    const completions = await Enrollment.countDocuments({ instructor: _id, status: 'completed' });

    const rated = courses.filter((c) => c.ratingCount > 0);
    const averageRating = rated.length
      ? Math.round((rated.reduce((sum, c) => sum + c.ratingAverage, 0) / rated.length) * 10) / 10
      : 0;

    return ok(res, {
      totalCourses: courses.length,
      publishedCourses: courses.filter((c) => c.status === COURSE_STATUS.PUBLISHED).length,
      pendingCourses: courses.filter((c) => c.status === COURSE_STATUS.PENDING).length,
      draftCourses: courses.filter((c) => c.status === COURSE_STATUS.DRAFT).length,
      totalStudents: enrollments,
      completions,
      averageRating,
    });
  }

  const enrollments = await Enrollment.find({ student: _id })
    .populate('progress')
    .select('status course')
    .lean();

  const percentages = enrollments.map((e) => e.progress?.percentage ?? 0);

  return ok(res, {
    enrolledCourses: enrollments.length,
    completedCourses: enrollments.filter((e) => e.status === 'completed').length,
    inProgressCourses: enrollments.filter((e) => e.status === 'active' && (e.progress?.percentage ?? 0) > 0).length,
    averageProgress: percentages.length
      ? Math.round(percentages.reduce((sum, p) => sum + p, 0) / percentages.length)
      : 0,
  });
});

/**
 * GET /api/users/instructors/:id
 * Public instructor profile plus their live courses.
 */
const getInstructorProfile = asyncHandler(async (req, res) => {
  const instructor = await User.findOne({ _id: req.params.id, role: ROLES.INSTRUCTOR }).lean();
  if (!instructor) throw ApiError.notFound('Instructor not found.');

  const courses = await Course.find({ instructor: instructor._id, status: COURSE_STATUS.PUBLISHED })
    .populate('category', 'name slug color')
    .select('title slug subtitle thumbnail ratingAverage ratingCount enrollmentCount isFree price discountPrice level totalDurationMinutes lessonCount')
    .sort({ enrollmentCount: -1 })
    .lean();

  const totalStudents = courses.reduce((sum, c) => sum + (c.enrollmentCount || 0), 0);
  const rated = courses.filter((c) => c.ratingCount > 0);

  return ok(res, {
    instructor,
    courses,
    stats: {
      totalCourses: courses.length,
      totalStudents,
      averageRating: rated.length
        ? Math.round((rated.reduce((sum, c) => sum + c.ratingAverage, 0) / rated.length) * 10) / 10
        : 0,
      totalReviews: courses.reduce((sum, c) => sum + (c.ratingCount || 0), 0),
    },
  });
});

/* ── Admin ───────────────────────────────────────────────────────────────── */

/** GET /api/users (admin) */
const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, { defaultLimit: 15 });

  const filter = {};
  if (req.query.role && req.query.role !== 'all') filter.role = req.query.role;
  if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;
  if (req.query.search?.trim()) {
    const rx = new RegExp(req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: rx }, { email: rx }];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  // Attach the one number an admin actually wants next to each row.
  const withCounts = await Promise.all(
    users.map(async (user) => {
      if (user.role === ROLES.INSTRUCTOR) {
        return { ...user, courseCount: await Course.countDocuments({ instructor: user._id }) };
      }
      if (user.role === ROLES.STUDENT) {
        return { ...user, enrollmentCount: await Enrollment.countDocuments({ student: user._id }) };
      }
      return user;
    })
  );

  return paginated(res, withCounts, { page, limit, total }, 'Users.');
});

/** GET /api/users/:id (admin) */
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).lean();
  if (!user) throw ApiError.notFound('User not found.');

  const extra = {};
  if (user.role === ROLES.INSTRUCTOR) {
    extra.courses = await Course.find({ instructor: user._id })
      .select('title slug status enrollmentCount ratingAverage createdAt')
      .sort({ createdAt: -1 })
      .lean();
  }
  if (user.role === ROLES.STUDENT) {
    extra.enrollments = await Enrollment.find({ student: user._id })
      .populate('course', 'title slug thumbnail')
      .populate('progress')
      .sort({ createdAt: -1 })
      .lean();
  }

  return ok(res, { user, ...extra }, 'User detail.');
});

/** PATCH /api/users/:id (admin) — role and status management. */
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found.');

  // An admin must not be able to lock themselves out of the platform.
  if (String(user._id) === String(req.user._id)) {
    if (req.body.role && req.body.role !== user.role) {
      throw ApiError.badRequest('You cannot change your own role.');
    }
    if (req.body.status === 'suspended') {
      throw ApiError.badRequest('You cannot suspend your own account.');
    }
  }

  if (user.isDemo && (req.body.role || req.body.status)) {
    throw ApiError.badRequest('Demo accounts cannot be modified — they keep the demo working.');
  }

  if (req.body.name !== undefined) user.name = req.body.name;
  if (req.body.role !== undefined) user.role = req.body.role;
  if (req.body.status !== undefined) user.status = req.body.status;

  await user.save();
  return ok(res, user, 'User updated.');
});

/** DELETE /api/users/:id (admin) */
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found.');

  if (String(user._id) === String(req.user._id)) {
    throw ApiError.badRequest('You cannot delete your own account.');
  }
  if (user.isDemo) throw ApiError.badRequest('Demo accounts cannot be deleted.');

  const courseCount = await Course.countDocuments({ instructor: user._id });
  if (courseCount > 0) {
    throw ApiError.conflict(
      `This instructor still owns ${courseCount} course(s). Delete or reassign them first.`
    );
  }

  await Enrollment.deleteMany({ student: user._id });
  await user.deleteOne();

  return ok(res, null, 'User deleted.');
});

module.exports = {
  getMyProfile,
  updateMyProfile,
  uploadAvatar,
  getMyStats,
  getInstructorProfile,
  listUsers,
  getUser,
  updateUser,
  deleteUser,
};
