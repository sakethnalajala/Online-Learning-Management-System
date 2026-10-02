const ROLES = Object.freeze({
  STUDENT: 'student',
  INSTRUCTOR: 'instructor',
  ADMIN: 'admin',
});

// Lifecycle: draft → pending → approved → (published | unpublished), or rejected.
const COURSE_STATUS = Object.freeze({
  DRAFT: 'draft',
  PENDING: 'pending',
  APPROVED: 'approved',
  PUBLISHED: 'published',
  UNPUBLISHED: 'unpublished',
  REJECTED: 'rejected',
});

const LEVELS = Object.freeze(['beginner', 'intermediate', 'advanced']);

const RESOURCE_TYPES = Object.freeze([
  'youtube',
  'video',
  'pdf',
  'document',
  'image',
  'text',
  'link',
]);

const LESSON_TYPES = Object.freeze(['video', 'article', 'quiz', 'mixed']);

const NOTIFICATION_TYPES = Object.freeze({
  ENROLLMENT: 'enrollment',
  NEW_LESSON: 'new_lesson',
  COURSE_APPROVAL: 'course_approval',
  COURSE_REJECTION: 'course_rejection',
  COURSE_COMPLETION: 'course_completion',
  INSTRUCTOR_UPDATE: 'instructor_update',
  CERTIFICATE: 'certificate',
  REVIEW: 'review',
  SYSTEM: 'system',
});

const USER_STATUS = Object.freeze(['active', 'suspended']);

module.exports = {
  ROLES,
  COURSE_STATUS,
  LEVELS,
  RESOURCE_TYPES,
  LESSON_TYPES,
  NOTIFICATION_TYPES,
  USER_STATUS,
};
