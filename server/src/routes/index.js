const express = require('express');

const router = express.Router();

/** API surface map, handy when opening the base URL in a browser. */
router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Lumina LMS API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      courses: '/api/courses',
      categories: '/api/categories',
      modules: '/api/modules',
      lessons: '/api/lessons',
      resources: '/api/resources',
      quizzes: '/api/quizzes',
      questions: '/api/questions',
      enrollments: '/api/enrollments',
      progress: '/api/progress',
      reviews: '/api/reviews',
      certificates: '/api/certificates',
      notifications: '/api/notifications',
      admin: '/api/admin',
    },
  });
});

router.use('/auth', require('./authRoutes'));
router.use('/users', require('./userRoutes'));
router.use('/courses', require('./courseRoutes'));
router.use('/categories', require('./categoryRoutes'));
router.use('/modules', require('./moduleRoutes'));
router.use('/lessons', require('./lessonRoutes'));
router.use('/resources', require('./resourceRoutes'));
router.use('/quizzes', require('./quizRoutes'));
router.use('/questions', require('./questionRoutes'));
router.use('/enrollments', require('./enrollmentRoutes'));
router.use('/progress', require('./progressRoutes'));
router.use('/reviews', require('./reviewRoutes'));
router.use('/certificates', require('./certificateRoutes'));
router.use('/notifications', require('./notificationRoutes'));
router.use('/admin', require('./adminRoutes'));

module.exports = router;
