const User = require('../models/User');
const Course = require('../models/Course');
const Category = require('../models/Category');
const Enrollment = require('../models/Enrollment');
const Progress = require('../models/Progress');
const Review = require('../models/Review');
const Certificate = require('../models/Certificate');
const Lesson = require('../models/Lesson');
const QuizAttempt = require('../models/QuizAttempt');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/apiResponse');
const { ROLES, COURSE_STATUS } = require('../config/constants');

const { dailySeries, utcMidnight } = require('../utils/daySeries');

/**
 * GET /api/admin/stats
 * The single payload behind the admin dashboard: totals, approval pipeline,
 * trends and leaderboards.
 */
const getPlatformStats = asyncHandler(async (req, res) => {
  const days = Math.min(90, Math.max(7, Number(req.query.days) || 30));

  const [
    totalUsers,
    totalStudents,
    totalInstructors,
    totalAdmins,
    suspendedUsers,
    totalCourses,
    totalCategories,
    totalEnrollments,
    completedEnrollments,
    totalReviews,
    totalCertificates,
    totalLessons,
    totalQuizAttempts,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: ROLES.STUDENT }),
    User.countDocuments({ role: ROLES.INSTRUCTOR }),
    User.countDocuments({ role: ROLES.ADMIN }),
    User.countDocuments({ status: 'suspended' }),
    Course.countDocuments(),
    Category.countDocuments(),
    Enrollment.countDocuments({ status: { $ne: 'cancelled' } }),
    Enrollment.countDocuments({ status: 'completed' }),
    Review.countDocuments(),
    Certificate.countDocuments(),
    Lesson.countDocuments(),
    QuizAttempt.countDocuments(),
  ]);

  const statusRows = await Course.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  const byStatus = Object.values(COURSE_STATUS).reduce((acc, status) => {
    acc[status] = statusRows.find((r) => r._id === status)?.count || 0;
    return acc;
  }, {});

  const reviewedTotal = byStatus.approved + byStatus.published + byStatus.unpublished + byStatus.rejected;

  const [enrollmentTrend, userTrend, courseTrend] = await Promise.all([
    dailySeries(Enrollment, days),
    dailySeries(User, days),
    dailySeries(Course, days),
  ]);

  // Signups split by role over the same window.
  const signupRows = await User.aggregate([
    {
      $match: {
        // Same window as the trend series, so the two agree.
        createdAt: { $gte: utcMidnight(days - 1) },
      },
    },
    { $group: { _id: '$role', count: { $sum: 1 } } },
  ]);

  const categoryRows = await Course.aggregate([
    { $group: { _id: '$category', courses: { $sum: 1 }, enrollments: { $sum: '$enrollmentCount' } } },
    { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
    { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
    { $sort: { courses: -1 } },
  ]);

  const [topCourses, topInstructors, recentEnrollments, avgProgress] = await Promise.all([
    Course.find({ status: COURSE_STATUS.PUBLISHED })
      .select('title slug thumbnail enrollmentCount ratingAverage ratingCount')
      .populate('instructor', 'name avatar')
      .sort({ enrollmentCount: -1 })
      .limit(8)
      .lean(),
    Enrollment.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: '$instructor', students: { $sum: 1 } } },
      { $sort: { students: -1 } },
      { $limit: 8 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'instructor' } },
      { $unwind: '$instructor' },
      {
        $project: {
          students: 1,
          'instructor._id': 1,
          'instructor.name': 1,
          'instructor.avatar': 1,
          'instructor.email': 1,
        },
      },
    ]),
    Enrollment.find()
      .populate('student', 'name avatar')
      .populate('course', 'title slug thumbnail')
      .sort({ createdAt: -1 })
      .limit(8)
      .lean(),
    Progress.aggregate([{ $group: { _id: null, average: { $avg: '$percentage' } } }]),
  ]);

  // Revenue is *potential*, not earned: no payment gateway is integrated, so
  // this is the list price of paid enrolments awaiting payment.
  const paidPending = await Enrollment.aggregate([
    { $match: { paymentStatus: 'pending_payment' } },
    { $lookup: { from: 'courses', localField: 'course', foreignField: '_id', as: 'course' } },
    { $unwind: '$course' },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        potential: {
          $sum: {
            $cond: [{ $gt: ['$course.discountPrice', 0] }, '$course.discountPrice', '$course.price'],
          },
        },
      },
    },
  ]);

  return ok(
    res,
    {
      totals: {
        users: totalUsers,
        students: totalStudents,
        instructors: totalInstructors,
        admins: totalAdmins,
        suspendedUsers,
        courses: totalCourses,
        categories: totalCategories,
        enrollments: totalEnrollments,
        completedEnrollments,
        reviews: totalReviews,
        certificates: totalCertificates,
        lessons: totalLessons,
        quizAttempts: totalQuizAttempts,
        completionRate: totalEnrollments
          ? Math.round((completedEnrollments / totalEnrollments) * 100)
          : 0,
        averageProgress: avgProgress[0] ? Math.round(avgProgress[0].average) : 0,
      },
      courseStatus: byStatus,
      approval: {
        pending: byStatus.pending,
        approved: byStatus.approved + byStatus.published + byStatus.unpublished,
        rejected: byStatus.rejected,
        draft: byStatus.draft,
        reviewed: reviewedTotal,
        approvalRate: reviewedTotal
          ? Math.round(
              ((byStatus.approved + byStatus.published + byStatus.unpublished) / reviewedTotal) * 100
            )
          : 0,
      },
      trends: { days, enrollments: enrollmentTrend, users: userTrend, courses: courseTrend },
      signupsByRole: Object.values(ROLES).map((role) => ({
        role,
        count: signupRows.find((r) => r._id === role)?.count || 0,
      })),
      categoryBreakdown: categoryRows.map((row) => ({
        categoryId: row._id,
        name: row.category?.name || 'Uncategorised',
        color: row.category?.color || '#8b5cf6',
        courses: row.courses,
        enrollments: row.enrollments,
      })),
      topCourses,
      topInstructors,
      recentEnrollments,
      payments: {
        gatewayIntegrated: false,
        pendingPaidEnrollments: paidPending[0]?.count || 0,
        potentialRevenue: paidPending[0]?.potential || 0,
      },
    },
    'Platform analytics.'
  );
});

/**
 * GET /api/admin/pending-courses
 * The approval queue, newest submission first.
 */
const getPendingCourses = asyncHandler(async (_req, res) => {
  const courses = await Course.find({ status: COURSE_STATUS.PENDING })
    .populate('instructor', 'name email avatar')
    .populate('category', 'name color')
    .sort({ submittedAt: 1 })
    .lean();

  const withCounts = await Promise.all(
    courses.map(async (course) => ({
      ...course,
      publishedLessons: await Lesson.countDocuments({ course: course._id, isPublished: true }),
    }))
  );

  return ok(res, withCounts, 'Courses awaiting approval.');
});

/** GET /api/admin/activity — recent platform events for the dashboard feed. */
const getRecentActivity = asyncHandler(async (_req, res) => {
  const [users, courses, enrollments, certificates, reviews] = await Promise.all([
    User.find().select('name role avatar createdAt').sort({ createdAt: -1 }).limit(6).lean(),
    Course.find()
      .select('title slug status createdAt submittedAt')
      .populate('instructor', 'name')
      .sort({ createdAt: -1 })
      .limit(6)
      .lean(),
    Enrollment.find()
      .populate('student', 'name')
      .populate('course', 'title')
      .sort({ createdAt: -1 })
      .limit(6)
      .lean(),
    Certificate.find().select('studentName courseTitle issuedAt').sort({ issuedAt: -1 }).limit(6).lean(),
    Review.find().populate('student', 'name').populate('course', 'title').sort({ createdAt: -1 }).limit(6).lean(),
  ]);

  // Merge into one reverse-chronological feed.
  const feed = [
    ...users.map((u) => ({
      type: 'user',
      at: u.createdAt,
      text: `${u.name} joined as ${u.role}`,
    })),
    ...courses.map((c) => ({
      type: 'course',
      at: c.createdAt,
      text: `${c.instructor?.name || 'An instructor'} created "${c.title}"`,
      link: '/admin/courses',
    })),
    ...enrollments.map((e) => ({
      type: 'enrollment',
      at: e.createdAt,
      text: `${e.student?.name || 'A student'} enrolled in "${e.course?.title || 'a course'}"`,
      link: '/admin/enrollments',
    })),
    ...certificates.map((c) => ({
      type: 'certificate',
      at: c.issuedAt,
      text: `${c.studentName} completed "${c.courseTitle}"`,
    })),
    ...reviews.map((r) => ({
      type: 'review',
      at: r.createdAt,
      text: `${r.student?.name || 'A student'} reviewed "${r.course?.title || 'a course'}" (${r.rating}★)`,
    })),
  ]
    .filter((item) => item.at)
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 20);

  return ok(res, feed, 'Recent platform activity.');
});

module.exports = { getPlatformStats, getPendingCourses, getRecentActivity };
