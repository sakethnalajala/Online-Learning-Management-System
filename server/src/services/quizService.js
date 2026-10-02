const Question = require('../models/Question');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const ApiError = require('../utils/ApiError');

/** Keeps questionCount / totalPoints on the quiz in step with its questions. */
async function syncQuizStats(quizId) {
  const questions = await Question.find({ quiz: quizId }).select('points').lean();
  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 1), 0);
  await Quiz.findByIdAndUpdate(quizId, { questionCount: questions.length, totalPoints });
  return { questionCount: questions.length, totalPoints };
}

/**
 * Strips correct-answer flags and explanations before a quiz reaches a student
 * who has not submitted yet. Grading happens server-side only.
 */
function sanitiseForAttempt(quiz, questions) {
  return {
    _id: quiz._id,
    lesson: quiz.lesson,
    course: quiz.course,
    title: quiz.title,
    description: quiz.description,
    passingScore: quiz.passingScore,
    timeLimitMinutes: quiz.timeLimitMinutes,
    maxAttempts: quiz.maxAttempts,
    isRequiredForCompletion: quiz.isRequiredForCompletion,
    questionCount: questions.length,
    totalPoints: questions.reduce((sum, q) => sum + (q.points || 1), 0),
    questions: questions.map((q) => ({
      _id: q._id,
      text: q.text,
      type: q.type,
      points: q.points,
      options: q.options.map((o) => ({ _id: o._id, text: o.text })),
    })),
  };
}

const shuffle = (items) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

/**
 * Grades a submission.
 * A question is correct only when the selected set exactly equals the correct
 * set — partial credit on multi-answer questions is not awarded.
 */
function grade(questions, submittedAnswers) {
  const byId = new Map(submittedAnswers.map((a) => [String(a.questionId), a]));

  let pointsEarned = 0;
  let totalPoints = 0;
  let correctCount = 0;

  const answers = questions.map((question) => {
    const points = question.points || 1;
    totalPoints += points;

    const submitted = byId.get(String(question._id));
    const selected = (submitted?.selectedOptionIds || []).map(String);
    const correct = question.correctOptionIds();

    const isCorrect =
      selected.length === correct.length && selected.every((id) => correct.includes(id));

    if (isCorrect) {
      pointsEarned += points;
      correctCount += 1;
    }

    return {
      question: question._id,
      selectedOptionIds: submitted?.selectedOptionIds || [],
      isCorrect,
      pointsAwarded: isCorrect ? points : 0,
    };
  });

  const score = totalPoints ? Math.round((pointsEarned / totalPoints) * 100) : 0;

  return { answers, pointsEarned, totalPoints, correctCount, score };
}

/** Throws when the student has used up a capped number of attempts. */
async function assertAttemptsRemaining(quiz, studentId) {
  if (!quiz.maxAttempts || quiz.maxAttempts <= 0) return 0; // unlimited
  const used = await QuizAttempt.countDocuments({ quiz: quiz._id, student: studentId });
  if (used >= quiz.maxAttempts) {
    throw ApiError.forbidden(
      `You have used all ${quiz.maxAttempts} attempts for this quiz.`
    );
  }
  return used;
}

/** Review payload returned after submission, including correct answers. */
function buildResult(quiz, questions, attempt) {
  const answerByQuestion = new Map(attempt.answers.map((a) => [String(a.question), a]));

  return {
    attemptId: attempt._id,
    quizId: quiz._id,
    title: quiz.title,
    attemptNumber: attempt.attemptNumber,
    score: attempt.score,
    passed: attempt.passed,
    passingScore: attempt.passingScore,
    pointsEarned: attempt.pointsEarned,
    totalPoints: attempt.totalPoints,
    correctCount: attempt.correctCount,
    questionCount: attempt.questionCount,
    submittedAt: attempt.submittedAt,
    review: quiz.showAnswersAfterSubmit
      ? questions.map((q) => {
          const given = answerByQuestion.get(String(q._id));
          return {
            questionId: q._id,
            text: q.text,
            type: q.type,
            points: q.points,
            explanation: q.explanation,
            isCorrect: given?.isCorrect ?? false,
            selectedOptionIds: (given?.selectedOptionIds || []).map(String),
            options: q.options.map((o) => ({
              _id: o._id,
              text: o.text,
              isCorrect: o.isCorrect,
            })),
          };
        })
      : [],
  };
}

module.exports = {
  syncQuizStats,
  sanitiseForAttempt,
  shuffle,
  grade,
  assertAttemptsRemaining,
  buildResult,
};
