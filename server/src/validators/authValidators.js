const { body } = require('express-validator');
const { ROLES } = require('../config/constants');
const { strongPassword } = require('./common');

const registerRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 80 })
    .withMessage('Name must be 2-80 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Enter a valid email address')
    .normalizeEmail({ gmail_remove_dots: false }),
  strongPassword('password'),
  body('confirmPassword')
    .optional()
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords do not match'),
  // Admin accounts are never self-served.
  body('role')
    .optional()
    .isIn([ROLES.STUDENT, ROLES.INSTRUCTOR])
    .withMessage('You can register as a student or an instructor'),
];

const loginRules = [
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Enter a valid email address'),
  body('password').notEmpty().withMessage('Password is required'),
];

const changePasswordRules = [
  body('currentPassword').notEmpty().withMessage('Your current password is required'),
  strongPassword('newPassword'),
  body('newPassword')
    .custom((value, { req }) => value !== req.body.currentPassword)
    .withMessage('The new password must be different from the current one'),
];

const refreshRules = [
  body('refreshToken').optional().isString().withMessage('Refresh token must be a string'),
];

module.exports = { registerRules, loginRules, changePasswordRules, refreshRules };
