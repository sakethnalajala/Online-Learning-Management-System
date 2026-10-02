import api from './client';

/**
 * Every REST call the app makes, in one place, grouped by resource.
 * Each function returns the unwrapped `data` payload so components never deal
 * with the response envelope. List calls that need pagination return the whole
 * body so `meta` is available.
 */

const unwrap = (res) => res.data.data;
const whole = (res) => res.data;

/* ── Auth ────────────────────────────────────────────────────────────────── */

export const authApi = {
  register: (payload) => api.post('/auth/register', payload).then(unwrap),
  login: (payload) => api.post('/auth/login', payload).then(unwrap),
  logout: () => api.post('/auth/logout').then(whole),
  me: () => api.get('/auth/me').then(unwrap),
  changePassword: (payload) => api.patch('/auth/password', payload).then(unwrap),
  // `role` narrows the list for the role-specific login screens.
  demoAccounts: (role) =>
    api.get('/auth/demo-accounts', { params: role ? { role } : {} }).then(unwrap),
};

/* ── Users ───────────────────────────────────────────────────────────────── */

export const userApi = {
  myProfile: () => api.get('/users/me').then(unwrap),
  updateProfile: (payload) => api.patch('/users/me', payload).then(unwrap),
  uploadAvatar: (file) => {
    const form = new FormData();
    form.append('avatar', file);
    return api
      .post('/users/me/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(unwrap);
  },
  myStats: () => api.get('/users/me/stats').then(unwrap),
  instructorProfile: (id) => api.get(`/users/instructors/${id}`).then(unwrap),

  // Admin
  list: (params) => api.get('/users', { params }).then(whole),
  get: (id) => api.get(`/users/${id}`).then(unwrap),
  update: (id, payload) => api.patch(`/users/${id}`, payload).then(unwrap),
  remove: (id) => api.delete(`/users/${id}`).then(whole),
};

/* ── Courses ─────────────────────────────────────────────────────────────── */

export const courseApi = {
  list: (params) => api.get('/courses', { params }).then(whole),
  featured: (limit = 6) => api.get('/courses/featured', { params: { limit } }).then(unwrap),
  publicStats: () => api.get('/courses/stats').then(unwrap),
  get: (idOrSlug) => api.get(`/courses/${idOrSlug}`).then(unwrap),

  // Instructor
  mine: (params) => api.get('/courses/instructor/mine', { params }).then(whole),
  create: (payload) => api.post('/courses', payload).then(unwrap),
  update: (id, payload) => api.patch(`/courses/${id}`, payload).then(unwrap),
  remove: (id) => api.delete(`/courses/${id}`).then(whole),
  uploadThumbnail: (id, file) => {
    const form = new FormData();
    form.append('thumbnail', file);
    return api
      .post(`/courses/${id}/thumbnail`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(unwrap);
  },
  submit: (id) => api.post(`/courses/${id}/submit`).then(unwrap),
  publish: (id) => api.post(`/courses/${id}/publish`).then(unwrap),
  unpublish: (id) => api.post(`/courses/${id}/unpublish`).then(unwrap),
  announce: (id, payload) => api.post(`/courses/${id}/announce`, payload).then(unwrap),
  students: (id, params) => api.get(`/courses/${id}/students`, { params }).then(whole),
  analytics: (id) => api.get(`/courses/${id}/analytics`).then(unwrap),
  resync: (id) => api.post(`/courses/${id}/resync`).then(unwrap),

  // Admin
  adminList: (params) => api.get('/courses/admin/all', { params }).then(whole),
  approve: (id, publish = true) => api.post(`/courses/${id}/approve`, { publish }).then(unwrap),
  reject: (id, reason) => api.post(`/courses/${id}/reject`, { reason }).then(unwrap),
  toggleFeatured: (id) => api.patch(`/courses/${id}/feature`).then(unwrap),
};

/* ── Categories ──────────────────────────────────────────────────────────── */

export const categoryApi = {
  list: (params) => api.get('/categories', { params }).then(unwrap),
  get: (idOrSlug) => api.get(`/categories/${idOrSlug}`).then(unwrap),
  create: (payload) => api.post('/categories', payload).then(unwrap),
  update: (id, payload) => api.patch(`/categories/${id}`, payload).then(unwrap),
  remove: (id) => api.delete(`/categories/${id}`).then(whole),
};

/* ── Modules ─────────────────────────────────────────────────────────────── */

export const moduleApi = {
  listByCourse: (courseId) => api.get(`/courses/${courseId}/modules`).then(unwrap),
  create: (courseId, payload) => api.post(`/courses/${courseId}/modules`, payload).then(unwrap),
  reorder: (courseId, order) =>
    api.patch(`/courses/${courseId}/modules/reorder`, { order }).then(unwrap),
  get: (id) => api.get(`/modules/${id}`).then(unwrap),
  update: (id, payload) => api.patch(`/modules/${id}`, payload).then(unwrap),
  remove: (id) => api.delete(`/modules/${id}`).then(whole),
};

/* ── Lessons ─────────────────────────────────────────────────────────────── */

export const lessonApi = {
  listByModule: (moduleId) => api.get(`/modules/${moduleId}/lessons`).then(unwrap),
  create: (moduleId, payload) => api.post(`/modules/${moduleId}/lessons`, payload).then(unwrap),
  reorder: (moduleId, order) =>
    api.patch(`/modules/${moduleId}/lessons/reorder`, { order }).then(unwrap),
  get: (id) => api.get(`/lessons/${id}`).then(unwrap),
  update: (id, payload) => api.patch(`/lessons/${id}`, payload).then(unwrap),
  remove: (id) => api.delete(`/lessons/${id}`).then(whole),
};

/* ── Resources ───────────────────────────────────────────────────────────── */

export const resourceApi = {
  listByLesson: (lessonId) => api.get(`/lessons/${lessonId}/resources`).then(unwrap),
  create: (lessonId, payload) => api.post(`/lessons/${lessonId}/resources`, payload).then(unwrap),
  upload: (lessonId, file, fields = {}) => {
    const form = new FormData();
    form.append('file', file);
    for (const [key, value] of Object.entries(fields)) form.append(key, value);
    return api
      .post(`/lessons/${lessonId}/resources/upload`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then(unwrap);
  },
  get: (id) => api.get(`/resources/${id}`).then(unwrap),
  update: (id, payload) => api.patch(`/resources/${id}`, payload).then(unwrap),
  remove: (id) => api.delete(`/resources/${id}`).then(whole),
  adminAll: (params) => api.get('/resources/admin/all', { params }).then(unwrap),
};

/* ── Quizzes ─────────────────────────────────────────────────────────────── */

export const quizApi = {
  createForLesson: (lessonId, payload) => api.post(`/lessons/${lessonId}/quiz`, payload).then(unwrap),
  getByLesson: (lessonId) => api.get(`/lessons/${lessonId}/quiz`).then(unwrap),
  get: (id) => api.get(`/quizzes/${id}`).then(unwrap),
  update: (id, payload) => api.patch(`/quizzes/${id}`, payload).then(unwrap),
  remove: (id) => api.delete(`/quizzes/${id}`).then(whole),

  addQuestion: (quizId, payload) => api.post(`/quizzes/${quizId}/questions`, payload).then(unwrap),
  updateQuestion: (id, payload) => api.patch(`/questions/${id}`, payload).then(unwrap),
  removeQuestion: (id) => api.delete(`/questions/${id}`).then(whole),

  submit: (quizId, payload) => api.post(`/quizzes/${quizId}/submit`, payload).then(unwrap),
  myAttempts: (quizId) => api.get(`/quizzes/${quizId}/attempts`).then(unwrap),
  getAttempt: (attemptId) => api.get(`/quizzes/attempts/${attemptId}`).then(unwrap),
  results: (quizId) => api.get(`/quizzes/${quizId}/results`).then(unwrap),
  myResults: () => api.get('/quizzes/me/results').then(unwrap),
};

/* ── Enrollments ─────────────────────────────────────────────────────────── */

export const enrollmentApi = {
  enroll: (courseId) => api.post('/enrollments', { courseId }).then(unwrap),
  mine: (params) => api.get('/enrollments/me', { params }).then(whole),
  forCourse: (courseId) => api.get(`/enrollments/me/course/${courseId}`).then(unwrap),
  unenroll: (id) => api.delete(`/enrollments/${id}`).then(whole),

  // Admin
  adminList: (params) => api.get('/enrollments', { params }).then(whole),
  grantAccess: (id) => api.patch(`/enrollments/${id}/access`).then(unwrap),
};

/* ── Progress ────────────────────────────────────────────────────────────── */

export const progressApi = {
  overview: () => api.get('/progress/me').then(unwrap),
  forCourse: (courseId) => api.get(`/progress/course/${courseId}`).then(unwrap),
  completeLesson: (lessonId, watchedSeconds = 0) =>
    api.post(`/progress/lessons/${lessonId}/complete`, { watchedSeconds }).then(unwrap),
  uncompleteLesson: (lessonId) => api.delete(`/progress/lessons/${lessonId}/complete`).then(unwrap),
  savePosition: (lessonId, watchedSeconds = 0) =>
    api.patch(`/progress/lessons/${lessonId}/position`, { watchedSeconds }).then(unwrap),
  studentProgress: (studentId, courseId) =>
    api.get(`/progress/students/${studentId}/course/${courseId}`).then(unwrap),
};

/* ── Reviews ─────────────────────────────────────────────────────────────── */

export const reviewApi = {
  listForCourse: (courseId, params) =>
    api.get(`/courses/${courseId}/reviews`, { params }).then(whole),
  summary: (courseId) => api.get(`/courses/${courseId}/reviews/summary`).then(unwrap),
  create: (courseId, payload) => api.post(`/courses/${courseId}/reviews`, payload).then(unwrap),
  mine: () => api.get('/reviews/me').then(unwrap),
  mineForCourse: (courseId) => api.get(`/reviews/me/course/${courseId}`).then(unwrap),
  update: (id, payload) => api.patch(`/reviews/${id}`, payload).then(unwrap),
  remove: (id) => api.delete(`/reviews/${id}`).then(whole),
};

/* ── Certificates ────────────────────────────────────────────────────────── */

export const certificateApi = {
  mine: () => api.get('/certificates/me').then(unwrap),
  get: (id) => api.get(`/certificates/${id}`).then(unwrap),
  verify: (code) => api.get(`/certificates/verify/${code}`).then(unwrap),
  claim: (courseId) => api.post(`/certificates/course/${courseId}/claim`).then(unwrap),
  issuedByMyCourses: () => api.get('/certificates/instructor/issued').then(unwrap),
  adminList: (params) => api.get('/certificates', { params }).then(whole),
};

/* ── Notifications ───────────────────────────────────────────────────────── */

export const notificationApi = {
  list: (params) => api.get('/notifications', { params }).then(whole),
  unreadCount: () => api.get('/notifications/unread-count').then(unwrap),
  markRead: (id) => api.patch(`/notifications/${id}/read`).then(unwrap),
  markAllRead: () => api.patch('/notifications/read-all').then(unwrap),
  remove: (id) => api.delete(`/notifications/${id}`).then(whole),
  clearRead: () => api.delete('/notifications/read').then(unwrap),
};

/* ── Admin ───────────────────────────────────────────────────────────────── */

export const adminApi = {
  stats: (days = 30) => api.get('/admin/stats', { params: { days } }).then(unwrap),
  pendingCourses: () => api.get('/admin/pending-courses').then(unwrap),
  activity: () => api.get('/admin/activity').then(unwrap),
};
