/** Single import point for every model, so registration order is deterministic. */
module.exports = {
  User: require('./User'),
  Category: require('./Category'),
  Course: require('./Course'),
  Module: require('./Module'),
  Lesson: require('./Lesson'),
  Resource: require('./Resource'),
  Enrollment: require('./Enrollment'),
  Progress: require('./Progress'),
  Quiz: require('./Quiz'),
  Question: require('./Question'),
  QuizAttempt: require('./QuizAttempt'),
  Review: require('./Review'),
  Certificate: require('./Certificate'),
  Notification: require('./Notification'),
};
