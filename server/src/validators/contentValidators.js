const { body } = require('express-validator');
const { RESOURCE_TYPES, LESSON_TYPES } = require('../config/constants');
const { objectId, urlOrPath, boolish } = require('./common');

/* ── Categories ──────────────────────────────────────────────────────────── */

const categoryRules = (partial = false) => {
  const required = (chain) => (partial ? chain.optional({ values: 'undefined' }) : chain);
  return [
    required(
      body('name')
        .trim()
        .notEmpty()
        .withMessage('Category name is required')
        .bail()
        .isLength({ min: 2, max: 60 })
        .withMessage('Category name must be 2-60 characters')
    ),
    body('description').optional().trim().isLength({ max: 400 }),
    body('icon').optional().trim().isLength({ max: 40 }),
    body('color')
      .optional()
      .matches(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
      .withMessage('Colour must be a hex value such as #8b5cf6'),
    boolish('isActive'),
  ];
};

/* ── Modules ─────────────────────────────────────────────────────────────── */

const moduleRules = (partial = false) => {
  const required = (chain) => (partial ? chain.optional({ values: 'undefined' }) : chain);
  return [
    required(
      body('title')
        .trim()
        .notEmpty()
        .withMessage('Module title is required')
        .bail()
        .isLength({ min: 3, max: 140 })
        .withMessage('Module title must be 3-140 characters')
    ),
    body('description').optional().trim().isLength({ max: 1000 }),
    body('order').optional().isInt({ min: 0 }).withMessage('Order must be 0 or greater').toInt(),
    boolish('isPublished'),
  ];
};

const reorderRules = [
  body('order')
    .isArray({ min: 1 })
    .withMessage('Send an "order" array of ids in their new sequence')
    .bail()
    .custom((ids) => ids.every((id) => /^[a-f\d]{24}$/i.test(String(id))))
    .withMessage('Every entry in "order" must be a valid id'),
];

/* ── Lessons ─────────────────────────────────────────────────────────────── */

const lessonRules = (partial = false) => {
  const required = (chain) => (partial ? chain.optional({ values: 'undefined' }) : chain);
  return [
    required(
      body('title')
        .trim()
        .notEmpty()
        .withMessage('Lesson title is required')
        .bail()
        .isLength({ min: 3, max: 160 })
        .withMessage('Lesson title must be 3-160 characters')
    ),
    body('summary').optional().trim().isLength({ max: 600 }),
    body('content').optional().isLength({ max: 40000 }).withMessage('Lesson content is too long'),
    body('type').optional().isIn(LESSON_TYPES).withMessage(`Type must be one of: ${LESSON_TYPES.join(', ')}`),
    urlOrPath('videoUrl'),
    body('videoProvider')
      .optional()
      .isIn(['youtube', 'upload', 'external', 'none'])
      .withMessage('Invalid video provider'),
    body('durationMinutes')
      .optional()
      .isInt({ min: 0, max: 1440 })
      .withMessage('Duration must be 0-1440 minutes')
      .toInt(),
    body('order').optional().isInt({ min: 0 }).toInt(),
    boolish('isPreview'),
    boolish('isPublished'),
  ];
};

/* ── Resources ───────────────────────────────────────────────────────────── */

const resourceRules = (partial = false) => {
  const required = (chain) => (partial ? chain.optional({ values: 'undefined' }) : chain);
  return [
    required(
      body('title')
        .trim()
        .notEmpty()
        .withMessage('Resource title is required')
        .bail()
        .isLength({ min: 2, max: 160 })
        .withMessage('Resource title must be 2-160 characters')
    ),
    required(
      body('type')
        .notEmpty()
        .withMessage('Resource type is required')
        .bail()
        .isIn(RESOURCE_TYPES)
        .withMessage(`Type must be one of: ${RESOURCE_TYPES.join(', ')}`)
    ),
    body('description').optional().trim().isLength({ max: 600 }),
    urlOrPath('url'),
    body('textContent').optional().isLength({ max: 20000 }).withMessage('Text content is too long'),
    body('order').optional().isInt({ min: 0 }).toInt(),
    boolish('isDownloadable'),
    // Type decides which payload field is mandatory.
    body('type').custom((type, { req }) => {
      if (partial && type === undefined) return true;
      if (type === 'text') {
        return Boolean(req.body.textContent && String(req.body.textContent).trim());
      }
      return Boolean(req.body.url && String(req.body.url).trim());
    }).withMessage('Text resources need content; every other type needs a URL or uploaded file'),
  ];
};

/* ── Quizzes and questions ───────────────────────────────────────────────── */

const quizRules = (partial = false) => {
  const required = (chain) => (partial ? chain.optional({ values: 'undefined' }) : chain);
  return [
    required(
      body('title')
        .trim()
        .notEmpty()
        .withMessage('Quiz title is required')
        .bail()
        .isLength({ min: 3, max: 160 })
        .withMessage('Quiz title must be 3-160 characters')
    ),
    body('description').optional().trim().isLength({ max: 800 }),
    body('passingScore')
      .optional()
      .isInt({ min: 0, max: 100 })
      .withMessage('Passing score must be 0-100')
      .toInt(),
    body('timeLimitMinutes')
      .optional()
      .isInt({ min: 0, max: 600 })
      .withMessage('Time limit must be 0-600 minutes')
      .toInt(),
    body('maxAttempts')
      .optional()
      .isInt({ min: 0, max: 50 })
      .withMessage('Max attempts must be 0 (unlimited) to 50')
      .toInt(),
    boolish('shuffleQuestions'),
    boolish('showAnswersAfterSubmit'),
    boolish('isRequiredForCompletion'),
    boolish('isPublished'),
  ];
};

const questionRules = (partial = false) => {
  const required = (chain) => (partial ? chain.optional({ values: 'undefined' }) : chain);
  return [
    required(
      body('text')
        .trim()
        .notEmpty()
        .withMessage('Question text is required')
        .bail()
        .isLength({ min: 3, max: 1200 })
        .withMessage('Question text must be 3-1200 characters')
    ),
    body('type').optional().isIn(['single', 'multiple', 'boolean']).withMessage('Invalid question type'),
    required(
      body('options')
        .isArray({ min: 2, max: 8 })
        .withMessage('Provide between 2 and 8 answer options')
        .bail()
        .custom((options) => options.every((o) => o && typeof o.text === 'string' && o.text.trim()))
        .withMessage('Every option needs text')
        .bail()
        .custom((options) => options.some((o) => o.isCorrect === true))
        .withMessage('Mark at least one option as correct')
        .bail()
        .custom((options, { req }) => {
          const correct = options.filter((o) => o.isCorrect === true).length;
          if (req.body.type === 'multiple') return correct >= 1;
          return correct === 1;
        })
        .withMessage('Single-answer questions must have exactly one correct option')
    ),
    body('explanation').optional().trim().isLength({ max: 1200 }),
    body('points').optional().isInt({ min: 1, max: 100 }).withMessage('Points must be 1-100').toInt(),
    body('order').optional().isInt({ min: 0 }).toInt(),
  ];
};

const submitQuizRules = [
  objectId('id'),
  body('answers')
    .isArray({ min: 1 })
    .withMessage('Answer at least one question before submitting')
    .bail()
    .custom((answers) =>
      answers.every(
        (a) =>
          a &&
          /^[a-f\d]{24}$/i.test(String(a.questionId)) &&
          Array.isArray(a.selectedOptionIds) &&
          a.selectedOptionIds.every((id) => /^[a-f\d]{24}$/i.test(String(id)))
      )
    )
    .withMessage('Each answer needs a questionId and a list of selected option ids'),
  body('timeSpentSeconds').optional().isInt({ min: 0, max: 86400 }).toInt(),
];

module.exports = {
  categoryRules,
  moduleRules,
  lessonRules,
  resourceRules,
  quizRules,
  questionRules,
  reorderRules,
  submitQuizRules,
};
