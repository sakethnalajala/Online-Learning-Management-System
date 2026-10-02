const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const QuizAttempt = require('../models/QuizAttempt');
const Lesson = require('../models/Lesson');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok, created } = require('../utils/apiResponse');
const courseService = require('../services/courseService');
const quizService = require('../services/quizService');
const enrollmentService = require('../services/enrollmentService');
const progressService = require('../services/progressService');

async function loadQuizForEdit(quizId, user) {
  const quiz = await Quiz.findById(quizId);
  if (!quiz) throw ApiError.notFound('Quiz not found.');
  const course = await courseService.getCourseOr404(quiz.course);
  courseService.assertCanEditCourse(course, user);
  return { quiz, course };
}

/* ── Instructor authoring ────────────────────────────────────────────────── */

/** POST /api/lessons/:lessonId/quiz — one quiz per lesson. */
const createQuiz = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.lessonId);
  if (!lesson) throw ApiError.notFound('Lesson not found.');

  const course = await courseService.getCourseOr404(lesson.course);
  courseService.assertCanEditCourse(course, req.user);

  if (await Quiz.exists({ lesson: lesson._id })) {
    throw ApiError.conflict('This lesson already has a quiz. Edit that one instead.');
  }

  const quiz = await Quiz.create({
    course: course._id,
    lesson: lesson._id,
    title: req.body.title,
    description: req.body.description || '',
    passingScore: req.body.passingScore ?? 60,
    timeLimitMinutes: req.body.timeLimitMinutes ?? 0,
    maxAttempts: req.body.maxAttempts ?? 0,
    shuffleQuestions: req.body.shuffleQuestions === true,
    showAnswersAfterSubmit: req.body.showAnswersAfterSubmit !== false,
    isRequiredForCompletion: req.body.isRequiredForCompletion === true,
    isPublished: req.body.isPublished !== false,
    createdBy: req.user._id,
  });

  lesson.hasQuiz = true;
  await lesson.save();

  return created(res, quiz, 'Quiz created. Add questions next.');
});

/**
 * GET /api/quizzes/:id
 * Returns the authoring view (with correct answers) to the owner/admin, and the
 * sanitised attempt view to an enrolled student.
 */
const getQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) throw ApiError.notFound('Quiz not found.');

  const course = await courseService.getCourseOr404(quiz.course);
  const isOwner = String(course.instructor) === String(req.user._id);
  const isAdmin = req.user.role === 'admin';

  const questions = await Question.find({ quiz: quiz._id }).sort({ order: 1 });

  if (isOwner || isAdmin) {
    return ok(res, { quiz, questions, mode: 'author' }, 'Quiz (authoring view).');
  }

  if (!quiz.isPublished) throw ApiError.notFound('Quiz not found.');
  await enrollmentService.requireAccess({ user: req.user, course, role: req.user.role });

  const ordered = quiz.shuffleQuestions ? quizService.shuffle(questions) : questions;
  const attempts = await QuizAttempt.find({ quiz: quiz._id, student: req.user._id })
    .select('attemptNumber score passed submittedAt')
    .sort({ attemptNumber: -1 })
    .lean();

  return ok(
    res,
    {
      quiz: quizService.sanitiseForAttempt(quiz, ordered),
      attempts,
      attemptsUsed: attempts.length,
      attemptsRemaining: quiz.maxAttempts ? Math.max(0, quiz.maxAttempts - attempts.length) : null,
      bestScore: attempts.length ? Math.max(...attempts.map((a) => a.score)) : null,
      mode: 'attempt',
    },
    'Quiz.'
  );
});

/** GET /api/lessons/:lessonId/quiz */
const getQuizByLesson = asyncHandler(async (req, res, next) => {
  const quiz = await Quiz.findOne({ lesson: req.params.lessonId }).select('_id').lean();
  if (!quiz) throw ApiError.notFound('This lesson does not have a quiz.');
  req.params.id = String(quiz._id);
  return getQuiz(req, res, next);
});

/** PATCH /api/quizzes/:id */
const updateQuiz = asyncHandler(async (req, res) => {
  const { quiz } = await loadQuizForEdit(req.params.id, req.user);

  for (const field of [
    'title',
    'description',
    'passingScore',
    'timeLimitMinutes',
    'maxAttempts',
    'shuffleQuestions',
    'showAnswersAfterSubmit',
    'isRequiredForCompletion',
    'isPublished',
  ]) {
    if (req.body[field] !== undefined) quiz[field] = req.body[field];
  }

  await quiz.save();
  return ok(res, quiz, 'Quiz updated.');
});

/** DELETE /api/quizzes/:id */
const deleteQuiz = asyncHandler(async (req, res) => {
  const { quiz } = await loadQuizForEdit(req.params.id, req.user);

  await Question.deleteMany({ quiz: quiz._id });
  await QuizAttempt.deleteMany({ quiz: quiz._id });
  const lessonId = quiz.lesson;
  await quiz.deleteOne();

  await Lesson.findByIdAndUpdate(lessonId, { hasQuiz: false });

  return ok(res, null, 'Quiz deleted along with its questions and attempts.');
});

/* ── Questions ───────────────────────────────────────────────────────────── */

/** POST /api/quizzes/:id/questions */
const addQuestion = asyncHandler(async (req, res) => {
  const { quiz } = await loadQuizForEdit(req.params.id, req.user);

  const last = await Question.findOne({ quiz: quiz._id }).sort({ order: -1 }).select('order').lean();

  const question = await Question.create({
    quiz: quiz._id,
    course: quiz.course,
    text: req.body.text,
    type: req.body.type || 'single',
    options: req.body.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect === true })),
    explanation: req.body.explanation || '',
    points: req.body.points ?? 1,
    order: req.body.order ?? (last ? last.order + 1 : 0),
  });

  await quizService.syncQuizStats(quiz._id);
  return created(res, question, 'Question added.');
});

/** PATCH /api/questions/:id */
const updateQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question) throw ApiError.notFound('Question not found.');

  await loadQuizForEdit(question.quiz, req.user);

  if (req.body.text !== undefined) question.text = req.body.text;
  if (req.body.type !== undefined) question.type = req.body.type;
  if (req.body.explanation !== undefined) question.explanation = req.body.explanation;
  if (req.body.points !== undefined) question.points = req.body.points;
  if (req.body.order !== undefined) question.order = req.body.order;
  if (req.body.options !== undefined) {
    question.options = req.body.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect === true }));
  }

  await question.save();
  await quizService.syncQuizStats(question.quiz);

  return ok(res, question, 'Question updated.');
});

/** DELETE /api/questions/:id */
const deleteQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question) throw ApiError.notFound('Question not found.');

  await loadQuizForEdit(question.quiz, req.user);

  const quizId = question.quiz;
  await question.deleteOne();
  await quizService.syncQuizStats(quizId);

  return ok(res, null, 'Question deleted.');
});

/* ── Student attempts ────────────────────────────────────────────────────── */

/**
 * POST /api/quizzes/:id/submit
 * Grades server-side, stores the attempt, and — when the quiz is required for
 * lesson completion — advances progress on a pass.
 */
const submitQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) throw ApiError.notFound('Quiz not found.');
  if (!quiz.isPublished) throw ApiError.badRequest('This quiz is not available yet.');

  const course = await courseService.getCourseOr404(quiz.course, [
    { path: 'instructor', select: 'name' },
  ]);

  // Instructors testing their own quiz should not create student attempts.
  if (String(course.instructor._id) === String(req.user._id) || req.user.role === 'admin') {
    throw ApiError.badRequest('Quiz attempts are recorded for enrolled students only.');
  }

  const { enrollment, progress } = await enrollmentService.requireAccess({
    user: req.user,
    course,
    role: req.user.role,
  });

  const attemptsUsed = await quizService.assertAttemptsRemaining(quiz, req.user._id);

  const questions = await Question.find({ quiz: quiz._id }).sort({ order: 1 });
  if (!questions.length) throw ApiError.badRequest('This quiz has no questions yet.');

  const graded = quizService.grade(questions, req.body.answers);
  const passed = graded.score >= quiz.passingScore;

  const attempt = await QuizAttempt.create({
    quiz: quiz._id,
    lesson: quiz.lesson,
    course: quiz.course,
    student: req.user._id,
    enrollment: enrollment._id,
    answers: graded.answers,
    attemptNumber: attemptsUsed + 1,
    score: graded.score,
    pointsEarned: graded.pointsEarned,
    totalPoints: graded.totalPoints,
    correctCount: graded.correctCount,
    questionCount: questions.length,
    passed,
    passingScore: quiz.passingScore,
    timeSpentSeconds: req.body.timeSpentSeconds || 0,
  });

  // A passed required quiz completes its lesson, which can finish the course.
  let completion = null;
  if (passed && quiz.isRequiredForCompletion) {
    const lesson = await Lesson.findById(quiz.lesson);
    if (lesson && !progress.hasCompleted(lesson._id)) {
      const result = await progressService.markLessonComplete(progress, lesson);
      completion = {
        percentage: result.progress.percentage,
        justCompletedCourse: result.justCompleted,
        certificateId: result.certificate?.certificateId || null,
      };
    }
  }

  const result = quizService.buildResult(quiz, questions, attempt);

  return created(
    res,
    { ...result, completion },
    passed ? `Passed with ${graded.score}%.` : `Scored ${graded.score}% — the pass mark is ${quiz.passingScore}%.`
  );
});

/** GET /api/quizzes/:id/attempts — the student's own history. */
const listMyAttempts = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id).lean();
  if (!quiz) throw ApiError.notFound('Quiz not found.');

  const attempts = await QuizAttempt.find({ quiz: quiz._id, student: req.user._id })
    .sort({ attemptNumber: -1 })
    .lean();

  return ok(
    res,
    {
      attempts,
      bestScore: attempts.length ? Math.max(...attempts.map((a) => a.score)) : null,
      hasPassed: attempts.some((a) => a.passed),
    },
    'Your attempts.'
  );
});

/** GET /api/quizzes/attempts/:attemptId — full review of one attempt. */
const getAttempt = asyncHandler(async (req, res) => {
  const attempt = await QuizAttempt.findById(req.params.attemptId);
  if (!attempt) throw ApiError.notFound('Attempt not found.');

  const course = await courseService.getCourseOr404(attempt.course);
  const isOwnAttempt = String(attempt.student) === String(req.user._id);
  const isInstructor = String(course.instructor) === String(req.user._id);

  if (!isOwnAttempt && !isInstructor && req.user.role !== 'admin') {
    throw ApiError.forbidden('You can only view your own quiz attempts.');
  }

  const quiz = await Quiz.findById(attempt.quiz);
  const questions = await Question.find({ quiz: attempt.quiz }).sort({ order: 1 });

  return ok(res, quizService.buildResult(quiz, questions, attempt), 'Attempt detail.');
});

/** GET /api/quizzes/:id/results — instructor view of everyone's scores. */
const getQuizResults = asyncHandler(async (req, res) => {
  const { quiz } = await loadQuizForEdit(req.params.id, req.user);

  const attempts = await QuizAttempt.find({ quiz: quiz._id })
    .populate('student', 'name email avatar')
    .sort({ createdAt: -1 })
    .lean();

  // One row per student: their best attempt.
  const best = new Map();
  for (const attempt of attempts) {
    const key = String(attempt.student?._id);
    if (!best.has(key) || attempt.score > best.get(key).score) best.set(key, attempt);
  }
  const rows = [...best.values()];

  return ok(
    res,
    {
      quiz: { _id: quiz._id, title: quiz.title, passingScore: quiz.passingScore, questionCount: quiz.questionCount },
      results: rows,
      totalAttempts: attempts.length,
      uniqueStudents: rows.length,
      averageScore: rows.length ? Math.round(rows.reduce((sum, r) => sum + r.score, 0) / rows.length) : 0,
      passRate: rows.length ? Math.round((rows.filter((r) => r.passed).length / rows.length) * 100) : 0,
    },
    'Quiz results.'
  );
});

/** GET /api/quizzes/me/results — every quiz result for the signed-in student. */
const listMyResults = asyncHandler(async (req, res) => {
  const attempts = await QuizAttempt.find({ student: req.user._id })
    .populate('course', 'title slug thumbnail')
    .populate('lesson', 'title')
    .populate('quiz', 'title passingScore')
    .sort({ createdAt: -1 })
    .lean();

  const byQuiz = new Map();
  for (const attempt of attempts) {
    const key = String(attempt.quiz?._id);
    if (!byQuiz.has(key) || attempt.score > byQuiz.get(key).score) byQuiz.set(key, attempt);
  }
  const bestAttempts = [...byQuiz.values()];

  return ok(
    res,
    {
      attempts,
      bestAttempts,
      summary: {
        totalAttempts: attempts.length,
        quizzesTaken: bestAttempts.length,
        quizzesPassed: bestAttempts.filter((a) => a.passed).length,
        averageScore: bestAttempts.length
          ? Math.round(bestAttempts.reduce((sum, a) => sum + a.score, 0) / bestAttempts.length)
          : 0,
      },
    },
    'Your quiz results.'
  );
});

module.exports = {
  createQuiz,
  getQuiz,
  getQuizByLesson,
  updateQuiz,
  deleteQuiz,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  submitQuiz,
  listMyAttempts,
  getAttempt,
  getQuizResults,
  listMyResults,
};
