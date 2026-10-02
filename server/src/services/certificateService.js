const crypto = require('crypto');
const Certificate = require('../models/Certificate');
const QuizAttempt = require('../models/QuizAttempt');
const notifications = require('./notificationService');

const randomBlock = (length) =>
  crypto.randomBytes(length).toString('base64url').replace(/[-_]/g, '').toUpperCase().slice(0, length);

/** Human-readable, collision-resistant public id, e.g. LMS-2026-8FK2QD. */
const buildCertificateId = () => `LMS-${new Date().getFullYear()}-${randomBlock(6)}`;

const buildVerificationCode = () => crypto.randomBytes(16).toString('hex');

/**
 * Issues the certificate for a finished course, or returns the existing one.
 * Idempotent: safe to call every time progress is recalculated at 100%.
 */
async function issueCertificate({ student, course, enrollment, progress }) {
  const existing = await Certificate.findOne({ student: student._id, course: course._id });
  if (existing) return { certificate: existing, created: false };

  const attempts = await QuizAttempt.find({ student: student._id, course: course._id })
    .select('quiz score')
    .lean();

  // Best score per quiz, then averaged, so retakes are rewarded not punished.
  const bestByQuiz = new Map();
  for (const attempt of attempts) {
    const key = String(attempt.quiz);
    if (!bestByQuiz.has(key) || attempt.score > bestByQuiz.get(key)) {
      bestByQuiz.set(key, attempt.score);
    }
  }
  const scores = [...bestByQuiz.values()];
  const averageQuizScore = scores.length
    ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length)
    : 0;

  let certificate;
  try {
    certificate = await Certificate.create({
      certificateId: buildCertificateId(),
      verificationCode: buildVerificationCode(),
      student: student._id,
      course: course._id,
      enrollment: enrollment._id,
      instructor: course.instructor?._id || course.instructor,
      studentName: student.name,
      courseTitle: course.title,
      instructorName: course.instructor?.name || '',
      completionPercentage: progress?.percentage ?? 100,
      totalLessons: progress?.totalLessons ?? 0,
      averageQuizScore,
      hoursOfContent: Math.round(((course.totalDurationMinutes || 0) / 60) * 10) / 10,
    });
  } catch (err) {
    // Lost a race against a concurrent completion — reuse the winner's row.
    if (err.code === 11000) {
      const winner = await Certificate.findOne({ student: student._id, course: course._id });
      if (winner) return { certificate: winner, created: false };
    }
    throw err;
  }

  await notifications.onCertificateIssued({ student: student._id, course, certificate });

  return { certificate, created: true };
}

module.exports = { issueCertificate, buildCertificateId };
