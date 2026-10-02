/**
 * End-to-end check of the complete learning workflow against the running API.
 * Registers a brand-new student, then walks the whole documented flow:
 * register -> login -> browse -> search -> detail -> enroll -> learn ->
 * complete lessons -> take quiz -> progress -> 100% -> certificate -> review.
 */
const API = process.env.API_URL || 'http://localhost:5050';

// Each demo role has its own password.
const PASSWORDS = {
  student: 'Student@2026',
  instructor: 'Teach@2026',
  admin: 'Admin@2026',
};

let pass = 0;
let fail = 0;

const check = (label, condition, extra = '') => {
  if (condition) {
    pass += 1;
    console.log(`  PASS  ${label}${extra ? ` — ${extra}` : ''}`);
  } else {
    fail += 1;
    console.log(`  FAIL  ${label}${extra ? ` — ${extra}` : ''}`);
  }
};

async function api(method, path, { token, body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { status: res.status, body: json };
}

(async () => {
  console.log('\n=== COMPLETE LEARNING WORKFLOW ===\n');

  // 1. Register
  const email = `flow.tester.${Date.now()}@example.com`;
  const reg = await api('POST', '/api/auth/register', {
    body: { name: 'Flow Tester', email, password: 'Passw0rd!', role: 'student' },
  });
  check('register new student', reg.status === 201 && reg.body.data.accessToken, `status ${reg.status}`);

  // 2. Login
  const login = await api('POST', '/api/auth/login', {
    body: { email, password: 'Passw0rd!' },
  });
  check('login', login.status === 200 && login.body.data.accessToken);
  const token = login.body.data.accessToken;

  // 2b. Weak password rejected
  const weak = await api('POST', '/api/auth/register', {
    body: { name: 'Weak', email: `weak.${Date.now()}@example.com`, password: 'abc' },
  });
  check('weak password rejected', weak.status === 422, `status ${weak.status}`);

  // 2c. Cannot self-register as admin
  const asAdmin = await api('POST', '/api/auth/register', {
    body: { name: 'Sneaky', email: `sneaky.${Date.now()}@example.com`, password: 'Passw0rd!', role: 'admin' },
  });
  check('cannot self-register as admin', asAdmin.status === 422, `status ${asAdmin.status}`);

  // 3. Browse
  const browse = await api('GET', '/api/courses?limit=20', { token });
  check('browse courses', browse.status === 200 && browse.body.data.length > 0, `${browse.body.data.length} courses`);
  check('only published courses listed', browse.body.data.every((c) => c.status === 'published'));

  // 4. Search + filter
  const search = await api('GET', '/api/courses?search=react', { token });
  check('search works', search.status === 200 && search.body.data.length > 0, `${search.body.data.length} hits for "react"`);

  const free = await api('GET', '/api/courses?price=free', { token });
  check('free filter works', free.body.data.every((c) => c.isFree === true), `${free.body.data.length} free`);

  const paid = await api('GET', '/api/courses?price=paid', { token });
  check('paid filter works', paid.body.data.every((c) => c.isFree === false), `${paid.body.data.length} paid`);

  const cats = await api('GET', '/api/categories?withCounts=true');
  check('categories with counts', cats.status === 200 && cats.body.data.length > 0, `${cats.body.data.length} categories`);

  const byCat = await api('GET', `/api/courses?category=${cats.body.data[0]._id}`, { token });
  check('category filter works', byCat.status === 200);

  // Pick the smallest free published course so completion is quick.
  // Smallest free course that also has a quiz, so the run exercises the whole
  // path — completion *and* grading — rather than whichever course is shortest.
  const freeCourses = browse.body.data
    .filter((c) => c.isFree && c.lessonCount > 0)
    .sort((a, b) => a.lessonCount - b.lessonCount);

  let target = null;
  for (const candidate of freeCourses.slice(0, 12)) {
    const peek = await api('GET', `/api/courses/${candidate.slug}`, { token });
    const hasQuiz = peek.body?.data?.curriculum
      ?.flatMap((m) => m.lessons)
      ?.some((l) => l.hasQuiz);
    if (hasQuiz) {
      target = candidate;
      break;
    }
  }
  target = target || freeCourses[0];

  check(
    'found a free course with a quiz to complete',
    Boolean(target),
    target ? `${target.title} (${target.lessonCount} lessons)` : ''
  );

  // 5. Course detail
  const detail = await api('GET', `/api/courses/${target.slug}`, { token });
  check('course detail by slug', detail.status === 200 && detail.body.data.course.title === target.title);
  check('curriculum returned', detail.body.data.curriculum.length > 0, `${detail.body.data.curriculum.length} modules`);
  check('not enrolled yet', detail.body.data.isEnrolled === false);
  check('instructor info present', Boolean(detail.body.data.course.instructor?.name), detail.body.data.course.instructor?.name);

  // Content is gated before enrolment
  const firstLessonId = detail.body.data.curriculum[0].lessons[0]._id;
  const gated = detail.body.data.curriculum
    .flatMap((m) => m.lessons)
    .find((l) => !l.isPreview);
  if (gated) {
    const blocked = await api('GET', `/api/lessons/${gated._id}`, { token });
    check('non-preview lesson blocked before enrolment', blocked.status === 403, `status ${blocked.status}`);
  }

  // 6. Enroll
  const enroll = await api('POST', '/api/enrollments', { token, body: { courseId: target._id } });
  check('enroll', enroll.status === 201, `status ${enroll.status}`);

  const dupe = await api('POST', '/api/enrollments', { token, body: { courseId: target._id } });
  check('duplicate enrolment rejected', dupe.status === 409, `status ${dupe.status}`);

  // 7. My Courses
  const mine = await api('GET', '/api/enrollments/me', { token });
  check('appears in My Courses', mine.body.data.some((e) => e.course._id === target._id));

  // 8. Progress / curriculum
  let prog = await api('GET', `/api/progress/course/${target._id}`, { token });
  check('progress starts at 0%', prog.body.data.progress.percentage === 0);
  check('resume point provided', Boolean(prog.body.data.resume.lessonId));

  // 9. Lesson content now accessible
  const lesson = await api('GET', `/api/lessons/${firstLessonId}`, { token });
  check('lesson content accessible after enrolment', lesson.status === 200);
  check('resources attached', Array.isArray(lesson.body.data.resources), `${lesson.body.data.resources.length} resources`);

  // 10. Walk every lesson: pass required quizzes, then mark complete
  const allLessons = prog.body.data.curriculum.flatMap((m) => m.lessons);
  let quizzesTaken = 0;
  let certificateId = null;
  let hitHundred = false;

  for (const l of allLessons) {
    if (l.hasQuiz) {
      const quizRes = await api('GET', `/api/lessons/${l._id}/quiz`, { token });
      if (quizRes.status === 200 && quizRes.body.data.quiz) {
        const quiz = quizRes.body.data.quiz;

        // The student view must never leak which option is correct.
        const leaks = quiz.questions.some((q) => q.options.some((o) => 'isCorrect' in o));
        check(`quiz "${quiz.title}" hides answers from students`, !leaks);

        // Submit deliberately correct answers by asking the author view? No —
        // a student cannot see them, so answer everything and check grading is
        // consistent, then retry until passed using the returned review.
        let attempt = await api('POST', `/api/quizzes/${quiz._id}/submit`, {
          token,
          body: {
            answers: quiz.questions.map((q) => ({
              questionId: q._id,
              selectedOptionIds: [q.options[0]._id],
            })),
            timeSpentSeconds: 60,
          },
        });
        check(`quiz "${quiz.title}" graded server-side`, attempt.status === 201 && typeof attempt.body.data.score === 'number', `score ${attempt.body.data?.score}%`);
        quizzesTaken += 1;

        // Use the post-submit review (allowed) to answer correctly on retry.
        if (!attempt.body.data.passed && attempt.body.data.review?.length) {
          const correct = attempt.body.data.review.map((r) => ({
            questionId: r.questionId,
            selectedOptionIds: r.options.filter((o) => o.isCorrect).map((o) => o._id),
          }));
          attempt = await api('POST', `/api/quizzes/${quiz._id}/submit`, {
            token,
            body: { answers: correct, timeSpentSeconds: 45 },
          });
          check(`quiz "${quiz.title}" passes with correct answers`, attempt.body.data.passed === true, `score ${attempt.body.data.score}%`);
        }
      }
    }

    const done = await api('POST', `/api/progress/lessons/${l._id}/complete`, {
      token,
      body: { watchedSeconds: 300 },
    });
    if (done.status !== 200) {
      check(`complete lesson "${l.title}"`, false, `status ${done.status}: ${done.body?.message}`);
      continue;
    }
    if (done.body.data.percentage === 100) hitHundred = true;
    if (done.body.data.certificate) certificateId = done.body.data.certificate.certificateId;
  }

  check('took at least one quiz', quizzesTaken > 0, `${quizzesTaken} quizzes`);

  // 11. 100% progress
  prog = await api('GET', `/api/progress/course/${target._id}`, { token });
  check('progress reaches 100%', prog.body.data.progress.percentage === 100, `${prog.body.data.progress.percentage}%`);
  check('course marked completed', prog.body.data.progress.isCompleted === true);
  check('completion detected during the walk', hitHundred);

  // 12. Certificate
  check('certificate issued automatically', Boolean(certificateId), certificateId || 'none');

  const certs = await api('GET', '/api/certificates/me', { token });
  const cert = certs.body.data.find((c) => c.course?._id === target._id);
  check('certificate listed on dashboard', Boolean(cert), cert?.certificateId);

  if (cert) {
    const verify = await api('GET', `/api/certificates/verify/${cert.certificateId}`);
    check('certificate publicly verifiable', verify.body.data.valid === true, verify.body.data.studentName);

    const bogus = await api('GET', '/api/certificates/verify/LMS-0000-XXXXXX');
    check('bogus certificate code rejected', bogus.body.data.valid === false);
  }

  // Enrolment reflects completion
  const mine2 = await api('GET', '/api/enrollments/me', { token });
  const row = mine2.body.data.find((e) => e.course._id === target._id);
  check('enrolment status is completed', row.status === 'completed');
  check('enrolment carries the certificate', Boolean(row.certificate));

  // 13. Reviews
  const review = await api('POST', `/api/courses/${target._id}/reviews`, {
    token,
    body: { rating: 5, title: 'Workflow test review', comment: 'Completed the whole course through the API.' },
  });
  check('create review', review.status === 201, `status ${review.status}`);

  const dupReview = await api('POST', `/api/courses/${target._id}/reviews`, {
    token,
    body: { rating: 4, comment: 'Second attempt' },
  });
  check('duplicate review rejected', dupReview.status === 409);

  const reviewId = review.body.data._id;
  const edited = await api('PATCH', `/api/reviews/${reviewId}`, {
    token,
    body: { rating: 4, comment: 'Edited after reflection.' },
  });
  check('edit own review', edited.status === 200 && edited.body.data.rating === 4);
  check('edit is flagged', edited.body.data.isEdited === true);

  const badRating = await api('PATCH', `/api/reviews/${reviewId}`, { token, body: { rating: 9 } });
  check('invalid rating rejected', badRating.status === 422);

  // Another student cannot touch this review
  const other = await api('POST', '/api/auth/login', {
    body: { email: 'sara.khan@example.com', password: PASSWORDS.student },
  });
  const otherToken = other.body.data.accessToken;
  const hijack = await api('PATCH', `/api/reviews/${reviewId}`, { token: otherToken, body: { rating: 1 } });
  check('cannot edit another student\'s review', hijack.status === 403, `status ${hijack.status}`);

  const hijackDelete = await api('DELETE', `/api/reviews/${reviewId}`, { token: otherToken });
  check('cannot delete another student\'s review', hijackDelete.status === 403);

  // Rating rolled up onto the course
  const after = await api('GET', `/api/courses/${target._id}`, { token });
  check('course rating reflects reviews', after.body.data.course.ratingCount > 0, `${after.body.data.course.ratingAverage} from ${after.body.data.course.ratingCount}`);

  const del = await api('DELETE', `/api/reviews/${reviewId}`, { token });
  check('delete own review', del.status === 200);

  // 14. Notifications produced by the workflow
  const notes = await api('GET', '/api/notifications', { token });
  const types = new Set(notes.body.data.map((n) => n.type));
  check('enrolment notification created', types.has('enrollment'));
  check('completion notification created', types.has('course_completion'));
  check('certificate notification created', types.has('certificate'));

  const unread = await api('GET', '/api/notifications/unread-count', { token });
  check('unread count endpoint', unread.status === 200 && unread.body.data.count > 0, `${unread.body.data.count} unread`);

  const readAll = await api('PATCH', '/api/notifications/read-all', { token });
  check('mark all as read', readAll.status === 200);
  const unread2 = await api('GET', '/api/notifications/unread-count', { token });
  check('unread count drops to 0', unread2.body.data.count === 0);

  // 15. Quiz results view
  const results = await api('GET', '/api/quizzes/me/results', { token });
  check('student quiz results', results.status === 200 && results.body.data.summary.quizzesTaken > 0, `${results.body.data.summary.quizzesTaken} quizzes, avg ${results.body.data.summary.averageScore}%`);

  // 16. Progress overview for the dashboard
  const overview = await api('GET', '/api/progress/me', { token });
  check('progress overview', overview.status === 200 && overview.body.data.summary.completed >= 1, `completed ${overview.body.data.summary.completed}`);

  // 17. Invalid id handling
  const badId = await api('GET', '/api/courses/not-a-real-course-slug', { token });
  check('unknown slug returns 404', badId.status === 404);

  const badObjectId = await api('GET', '/api/progress/course/123', { token });
  check('invalid ObjectId returns 422', badObjectId.status === 422, `status ${badObjectId.status}`);

  console.log(`\n=== ${pass} passed, ${fail} failed ===\n`);
  process.exit(fail > 0 ? 1 : 0);
})().catch((err) => {
  console.error('\nTEST HARNESS ERROR:', err);
  process.exit(1);
});
