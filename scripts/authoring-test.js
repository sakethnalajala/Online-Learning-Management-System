/**
 * Instructor authoring + admin approval workflow against the running API.
 * Creates a course from nothing, builds the module/lesson/resource/quiz tree,
 * submits it, has an admin approve it, then confirms it becomes discoverable
 * and enrollable — i.e. that admin approval really gates availability.
 */
const API = process.env.API_URL || 'http://localhost:5050';

// Each demo role has its own password.
const PASSWORDS = {
  student: 'Student@2026',
  instructor: 'Teach@2026',
  admin: 'Admin@2026',
};

const roleFor = (email) =>
  email.startsWith('admin') ? 'admin' : email.endsWith('@lumina.dev') ? 'instructor' : 'student';

let pass = 0;
let fail = 0;
const check = (label, ok, extra = '') => {
  if (ok) { pass += 1; console.log(`  PASS  ${label}${extra ? ` — ${extra}` : ''}`); }
  else { fail += 1; console.log(`  FAIL  ${label}${extra ? ` — ${extra}` : ''}`); }
};

async function api(method, path, { token, body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let json = null;
  try { json = await res.json(); } catch { json = null; }
  return { status: res.status, body: json };
}

const loginAs = async (email) => {
  const res = await api('POST', '/api/auth/login', {
    body: { email, password: PASSWORDS[roleFor(email)] },
  });
  return res.body.data.accessToken;
};

(async () => {
  console.log('\n=== INSTRUCTOR AUTHORING + ADMIN APPROVAL ===\n');

  const instructor = await loginAs('ananya.verma@lumina.dev');
  const admin = await loginAs('admin@lumina.dev');
  const student = await loginAs('aditya.rao@example.com');

  const cats = await api('GET', '/api/categories');
  const categoryId = cats.body.data[0]._id;

  // Create
  const title = `Workflow Test Course ${Date.now()}`;
  const create = await api('POST', '/api/courses', {
    token: instructor,
    body: {
      title,
      subtitle: 'Built entirely through the REST API',
      description:
        'A course created by the authoring workflow test to prove the full instructor pipeline works end to end, including modules, lessons, resources and quizzes.',
      category: categoryId,
      level: 'beginner',
      isFree: true,
      tags: ['test', 'workflow'],
      whatYouWillLearn: ['That the API works'],
      requirements: ['Nothing'],
    },
  });
  check('instructor creates course', create.status === 201, `status ${create.status}`);
  check('new course starts as draft', create.body.data.status === 'draft', create.body.data.status);
  check('slug auto-generated', Boolean(create.body.data.slug), create.body.data.slug);
  const courseId = create.body.data._id;

  const bad = await api('POST', '/api/courses', {
    token: instructor,
    body: { title: 'ab', description: 'short', category: 'nope' },
  });
  check('invalid course payload rejected', bad.status === 422, `status ${bad.status}`);
  check('validation returns per-field errors', bad.body.errors && Object.keys(bad.body.errors).length >= 2, Object.keys(bad.body.errors || {}).join(', '));

  const paidNoPrice = await api('POST', '/api/courses', {
    token: instructor,
    body: {
      title: 'Paid course with no price at all',
      description: 'This should be rejected because a paid course needs a price above zero.',
      category: categoryId,
      isFree: false,
      price: 0,
    },
  });
  check('paid course without a price rejected', paidNoPrice.status === 422);

  const earlyPublish = await api('POST', `/api/courses/${courseId}/publish`, { token: instructor });
  check('cannot publish before approval', earlyPublish.status === 400, earlyPublish.body.message);

  const emptySubmit = await api('POST', `/api/courses/${courseId}/submit`, { token: instructor });
  check('cannot submit a course with no lessons', emptySubmit.status === 400, emptySubmit.body.message);

  // Modules
  const m1 = await api('POST', `/api/courses/${courseId}/modules`, {
    token: instructor,
    body: { title: 'Module One: Getting Started', description: 'The opening section.' },
  });
  check('create module', m1.status === 201);

  const m2 = await api('POST', `/api/courses/${courseId}/modules`, {
    token: instructor,
    body: { title: 'Module Two: Going Deeper' },
  });
  check('create second module', m2.status === 201);
  check('modules ordered automatically', m2.body.data.order === 1, `order ${m2.body.data.order}`);

  const reorder = await api('PATCH', `/api/courses/${courseId}/modules/reorder`, {
    token: instructor,
    body: { order: [m2.body.data._id, m1.body.data._id] },
  });
  check('reorder modules', reorder.status === 200 && reorder.body.data[0]._id === m2.body.data._id);

  await api('PATCH', `/api/courses/${courseId}/modules/reorder`, {
    token: instructor,
    body: { order: [m1.body.data._id, m2.body.data._id] },
  });

  const editModule = await api('PATCH', `/api/modules/${m2.body.data._id}`, {
    token: instructor,
    body: { title: 'Module Two: Advanced Topics' },
  });
  check('edit module', editModule.status === 200 && editModule.body.data.title === 'Module Two: Advanced Topics');

  // Lessons
  const l1 = await api('POST', `/api/modules/${m1.body.data._id}/lessons`, {
    token: instructor,
    body: {
      title: 'Welcome and orientation',
      summary: 'What this course covers.',
      content: 'A written introduction to the material.',
      videoUrl: 'https://www.youtube.com/watch?v=Tn6-PIqc4UM',
      durationMinutes: 12,
      isPreview: true,
    },
  });
  check('create lesson', l1.status === 201);
  check('youtube provider detected', l1.body.data.videoProvider === 'youtube', l1.body.data.videoProvider);

  const l2 = await api('POST', `/api/modules/${m2.body.data._id}/lessons`, {
    token: instructor,
    body: { title: 'The main technique', content: 'Body text for lesson two.', durationMinutes: 18 },
  });
  check('create second lesson', l2.status === 201);

  const lessonReorder = await api('PATCH', `/api/modules/${m1.body.data._id}/lessons/reorder`, {
    token: instructor,
    body: { order: [l1.body.data._id] },
  });
  check('reorder lessons', lessonReorder.status === 200);

  const editLesson = await api('PATCH', `/api/lessons/${l2.body.data._id}`, {
    token: instructor,
    body: { durationMinutes: 22 },
  });
  check('edit lesson', editLesson.status === 200 && editLesson.body.data.durationMinutes === 22);

  const afterLessons = await api('GET', `/api/courses/${courseId}`, { token: instructor });
  check('course lessonCount synced', afterLessons.body.data.course.lessonCount === 2, `${afterLessons.body.data.course.lessonCount}`);
  check('course moduleCount synced', afterLessons.body.data.course.moduleCount === 2);
  check('total duration synced', afterLessons.body.data.course.totalDurationMinutes === 34, `${afterLessons.body.data.course.totalDurationMinutes} min`);

  // Resources: every supported type
  const types = [
    { type: 'youtube', title: 'Supplementary video', url: 'https://www.youtube.com/watch?v=SqcY0GlETPk' },
    { type: 'pdf', title: 'Reference PDF', url: 'https://example.com/guide.pdf' },
    { type: 'document', title: 'Worksheet', url: 'https://example.com/worksheet.docx' },
    { type: 'image', title: 'Architecture diagram', url: 'https://example.com/diagram.png' },
    { type: 'link', title: 'Official docs', url: 'https://react.dev' },
    { type: 'text', title: 'Cheat sheet', textContent: 'Key points to remember from this lesson.' },
    { type: 'video', title: 'Hosted recording', url: 'https://example.com/recording.mp4' },
  ];
  let resourceOk = 0;
  for (const r of types) {
    const res = await api('POST', `/api/lessons/${l1.body.data._id}/resources`, { token: instructor, body: r });
    if (res.status === 201) resourceOk += 1;
    else console.log(`        (${r.type} failed: ${res.body?.message})`);
  }
  check('all 7 resource types accepted', resourceOk === 7, `${resourceOk}/7`);

  const badResource = await api('POST', `/api/lessons/${l1.body.data._id}/resources`, {
    token: instructor,
    body: { type: 'pdf', title: 'No URL supplied' },
  });
  check('resource without a URL rejected', badResource.status === 422);

  const textNoContent = await api('POST', `/api/lessons/${l1.body.data._id}/resources`, {
    token: instructor,
    body: { type: 'text', title: 'Empty text' },
  });
  check('text resource without content rejected', textNoContent.status === 422);

  // Quiz
  const quiz = await api('POST', `/api/lessons/${l2.body.data._id}/quiz`, {
    token: instructor,
    body: { title: 'Module Two assessment', passingScore: 70, isRequiredForCompletion: true, maxAttempts: 0 },
  });
  check('create quiz', quiz.status === 201);
  const quizId = quiz.body.data._id;

  const dupQuiz = await api('POST', `/api/lessons/${l2.body.data._id}/quiz`, {
    token: instructor,
    body: { title: 'Second quiz on same lesson' },
  });
  check('one quiz per lesson enforced', dupQuiz.status === 409);

  const q1 = await api('POST', `/api/quizzes/${quizId}/questions`, {
    token: instructor,
    body: {
      text: 'Which statement is correct?',
      type: 'single',
      options: [
        { text: 'The right answer', isCorrect: true },
        { text: 'A wrong answer', isCorrect: false },
        { text: 'Another wrong answer', isCorrect: false },
      ],
      explanation: 'Because it is.',
      points: 2,
    },
  });
  check('add single-answer question', q1.status === 201);

  const q2 = await api('POST', `/api/quizzes/${quizId}/questions`, {
    token: instructor,
    body: {
      text: 'Select all that apply.',
      type: 'multiple',
      options: [
        { text: 'Correct one', isCorrect: true },
        { text: 'Also correct', isCorrect: true },
        { text: 'Not correct', isCorrect: false },
      ],
    },
  });
  check('add multiple-answer question', q2.status === 201);

  const noCorrect = await api('POST', `/api/quizzes/${quizId}/questions`, {
    token: instructor,
    body: { text: 'No correct option marked', options: [{ text: 'a', isCorrect: false }, { text: 'b', isCorrect: false }] },
  });
  check('question without a correct answer rejected', noCorrect.status === 422);

  const twoCorrectSingle = await api('POST', `/api/quizzes/${quizId}/questions`, {
    token: instructor,
    body: { text: 'Single type with two correct', type: 'single', options: [{ text: 'a', isCorrect: true }, { text: 'b', isCorrect: true }] },
  });
  check('single-answer with two correct options rejected', twoCorrectSingle.status === 422);

  const oneOption = await api('POST', `/api/quizzes/${quizId}/questions`, {
    token: instructor,
    body: { text: 'Only one option', options: [{ text: 'a', isCorrect: true }] },
  });
  check('question with fewer than 2 options rejected', oneOption.status === 422);

  const editQ = await api('PATCH', `/api/questions/${q1.body.data._id}`, { token: instructor, body: { points: 3 } });
  check('edit question', editQ.status === 200 && editQ.body.data.points === 3);

  const quizAuthor = await api('GET', `/api/quizzes/${quizId}`, { token: instructor });
  check('author view shows correct answers', quizAuthor.body.data.mode === 'author' && quizAuthor.body.data.questions[0].options.some((o) => 'isCorrect' in o));
  check('quiz totals synced', quizAuthor.body.data.quiz.questionCount === 2 && quizAuthor.body.data.quiz.totalPoints === 4, `${quizAuthor.body.data.quiz.questionCount} q / ${quizAuthor.body.data.quiz.totalPoints} pts`);

  // Ownership
  const otherInstructor = await loginAs('rohan.iyer@lumina.dev');
  const steal = await api('PATCH', `/api/courses/${courseId}`, {
    token: otherInstructor,
    body: { title: 'Hijacked course title here' },
  });
  check('other instructor cannot edit this course', steal.status === 403, steal.body.message);

  const stealModule = await api('POST', `/api/courses/${courseId}/modules`, {
    token: otherInstructor,
    body: { title: 'Injected module' },
  });
  check('other instructor cannot add modules', stealModule.status === 403);

  const stealQuiz = await api('DELETE', `/api/quizzes/${quizId}`, { token: otherInstructor });
  check('other instructor cannot delete the quiz', stealQuiz.status === 403);

  // Not discoverable while unapproved
  const hiddenList = await api('GET', `/api/courses?search=${encodeURIComponent('Workflow Test Course')}`, { token: student });
  check('draft course not in the public catalogue', hiddenList.body.data.length === 0, `${hiddenList.body.data.length} results`);

  const hiddenDetail = await api('GET', `/api/courses/${courseId}`, { token: student });
  check('student cannot open a draft course', hiddenDetail.status === 404);

  const earlyEnroll = await api('POST', '/api/enrollments', { token: student, body: { courseId } });
  check('cannot enrol in an unpublished course', earlyEnroll.status === 400, earlyEnroll.body.message);

  // Submit for approval
  const submit = await api('POST', `/api/courses/${courseId}/submit`, { token: instructor });
  check('submit for approval', submit.status === 200 && submit.body.data.status === 'pending', submit.body.data?.status);

  const queue = await api('GET', '/api/admin/pending-courses', { token: admin });
  check('appears in the admin approval queue', queue.body.data.some((c) => c._id === courseId), `${queue.body.data.length} pending`);

  const instructorApprove = await api('POST', `/api/courses/${courseId}/approve`, { token: instructor });
  check('instructor cannot approve their own course', instructorApprove.status === 403);

  const studentApprove = await api('POST', `/api/courses/${courseId}/approve`, { token: student });
  check('student cannot approve courses', studentApprove.status === 403);

  // Admin approves
  const approve = await api('POST', `/api/courses/${courseId}/approve`, { token: admin });
  check('admin approves and publishes', approve.status === 200 && approve.body.data.status === 'published', approve.body.data?.status);

  const nowVisible = await api('GET', `/api/courses?search=${encodeURIComponent('Workflow Test Course')}`, { token: student });
  check('course now discoverable by students', nowVisible.body.data.some((c) => c._id === courseId));

  const nowEnroll = await api('POST', '/api/enrollments', { token: student, body: { courseId } });
  check('student can now enrol', nowEnroll.status === 201);

  const instructorNotes = await api('GET', '/api/notifications?type=course_approval', { token: instructor });
  check('instructor notified of approval', instructorNotes.body.data.some((n) => String(n.course?._id) === courseId));

  // Student monitoring
  const students = await api('GET', `/api/courses/${courseId}/students`, { token: instructor });
  check('instructor sees enrolled students', students.status === 200 && students.body.data.length === 1, `${students.body.data.length} student(s)`);
  check('student row carries progress', typeof students.body.data[0].percentage === 'number');

  const analytics = await api('GET', `/api/courses/${courseId}/analytics`, { token: instructor });
  check('course analytics', analytics.status === 200 && Array.isArray(analytics.body.data.enrollmentTrend), `${analytics.body.data.enrollmentTrend?.length} day trend`);

  const blocked = await api('POST', `/api/progress/lessons/${l2.body.data._id}/complete`, { token: student });
  check('required quiz gates lesson completion', blocked.status === 400, blocked.body.message?.slice(0, 60));

  // Announcement
  const announce = await api('POST', `/api/courses/${courseId}/announce`, {
    token: instructor,
    body: { title: 'New material added', message: 'I have added a new lesson to module two.' },
  });
  check('instructor announcement sent', announce.status === 200 && announce.body.data.notified === 1);

  const studentNotes = await api('GET', '/api/notifications?type=instructor_update', { token: student });
  check('student receives instructor update', studentNotes.body.data.length > 0);

  const l3 = await api('POST', `/api/modules/${m2.body.data._id}/lessons`, {
    token: instructor,
    body: { title: 'A freshly added lesson', durationMinutes: 9 },
  });
  check('add lesson to a live course', l3.status === 201);
  const newLessonNotes = await api('GET', '/api/notifications?type=new_lesson', { token: student });
  check('enrolled student notified of the new lesson', newLessonNotes.body.data.length > 0);

  // Unpublish / republish
  const unpublish = await api('POST', `/api/courses/${courseId}/unpublish`, { token: instructor });
  check('unpublish', unpublish.status === 200 && unpublish.body.data.status === 'unpublished');

  const goneFromCatalogue = await api('GET', `/api/courses?search=${encodeURIComponent('Workflow Test Course')}`, { token: student });
  check('unpublished course leaves the catalogue', goneFromCatalogue.body.data.length === 0);

  const republish = await api('POST', `/api/courses/${courseId}/publish`, { token: instructor });
  check('republish an approved course', republish.status === 200 && republish.body.data.status === 'published');

  // Rejection path
  const c2 = await api('POST', '/api/courses', {
    token: instructor,
    body: {
      title: `Rejection Path Course ${Date.now()}`,
      description: 'A second course used to exercise the rejection branch of the approval workflow.',
      category: categoryId,
      isFree: true,
    },
  });
  const c2Id = c2.body.data._id;
  const c2m = await api('POST', `/api/courses/${c2Id}/modules`, { token: instructor, body: { title: 'Only module' } });
  await api('POST', `/api/modules/${c2m.body.data._id}/lessons`, { token: instructor, body: { title: 'Only lesson', durationMinutes: 5 } });
  await api('POST', `/api/courses/${c2Id}/submit`, { token: instructor });

  const rejectNoReason = await api('POST', `/api/courses/${c2Id}/reject`, { token: admin, body: {} });
  check('rejection requires a reason', rejectNoReason.status === 422);

  const reject = await api('POST', `/api/courses/${c2Id}/reject`, {
    token: admin,
    body: { reason: 'The curriculum is too thin for the stated scope. Please expand it.' },
  });
  check('admin rejects course', reject.status === 200 && reject.body.data.status === 'rejected');
  check('rejection reason stored', reject.body.data.rejectionReason.includes('too thin'));

  const rejectNotes = await api('GET', '/api/notifications?type=course_rejection', { token: instructor });
  check('instructor notified of rejection', rejectNotes.body.data.some((n) => String(n.course?._id) === c2Id));

  const rejectedHidden = await api('GET', `/api/courses?search=${encodeURIComponent('Rejection Path Course')}`, { token: student });
  check('rejected course not discoverable', rejectedHidden.body.data.length === 0);

  // Admin platform management
  const allCourses = await api('GET', '/api/courses/admin/all', { token: admin });
  check('admin sees all courses regardless of status', allCourses.status === 200 && allCourses.body.meta.total > 6, `${allCourses.body.meta.total} total`);

  const users = await api('GET', '/api/users?role=instructor', { token: admin });
  check('admin lists users by role', users.status === 200 && users.body.data.every((u) => u.role === 'instructor'), `${users.body.data.length} instructors`);

  const enrollments = await api('GET', '/api/enrollments', { token: admin });
  check('admin views platform enrolments', enrollments.status === 200 && enrollments.body.data.length > 0, `${enrollments.body.meta.total} total`);

  const resources = await api('GET', '/api/resources/admin/all', { token: admin });
  check('admin views platform resources', resources.status === 200 && resources.body.data.resources.length > 0, `${resources.body.data.resources.length} resources`);

  const certs = await api('GET', '/api/certificates', { token: admin });
  check('admin views issued certificates', certs.status === 200, `${certs.body.meta.total} certificates`);

  const activity = await api('GET', '/api/admin/activity', { token: admin });
  check('admin activity feed', activity.status === 200 && activity.body.data.length > 0, `${activity.body.data.length} events`);

  // Category management
  const newCat = await api('POST', '/api/categories', {
    token: admin,
    body: { name: `Test Category ${Date.now()}`, description: 'Created by the workflow test.', color: '#22d3ee' },
  });
  check('admin creates category', newCat.status === 201);

  const dupCat = await api('POST', '/api/categories', { token: admin, body: { name: newCat.body.data.name } });
  check('duplicate category name rejected', dupCat.status === 409);

  const editCat = await api('PATCH', `/api/categories/${newCat.body.data._id}`, {
    token: admin,
    body: { description: 'Updated description.' },
  });
  check('admin edits category', editCat.status === 200);

  const inUseCat = await api('DELETE', `/api/categories/${categoryId}`, { token: admin });
  check('cannot delete a category in use', inUseCat.status === 409, inUseCat.body.message?.slice(0, 50));

  const delCat = await api('DELETE', `/api/categories/${newCat.body.data._id}`, { token: admin });
  check('admin deletes unused category', delCat.status === 200);

  const instructorCat = await api('POST', '/api/categories', { token: instructor, body: { name: 'Instructor made this' } });
  check('instructor cannot create categories', instructorCat.status === 403);

  // Suspension
  const victim = await api('POST', '/api/auth/register', {
    body: { name: 'Suspension Test', email: `suspend.${Date.now()}@example.com`, password: 'Passw0rd!' },
  });
  const victimId = victim.body.data.user._id;
  const suspend = await api('PATCH', `/api/users/${victimId}`, { token: admin, body: { status: 'suspended' } });
  check('admin suspends a user', suspend.status === 200 && suspend.body.data.status === 'suspended');

  const suspendedLogin = await api('POST', '/api/auth/login', {
    body: { email: victim.body.data.user.email, password: 'Passw0rd!' },
  });
  check('suspended user cannot log in', suspendedLogin.status === 403, suspendedLogin.body.message);

  const suspendedCall = await api('GET', '/api/auth/me', { token: victim.body.data.accessToken });
  check('existing token stops working after suspension', suspendedCall.status === 403);

  const adminMe = await api('GET', '/api/auth/me', { token: admin });
  const selfSuspend = await api('PATCH', `/api/users/${adminMe.body.data.user._id}`, {
    token: admin,
    body: { status: 'suspended' },
  });
  check('admin cannot suspend themselves', selfSuspend.status === 400, selfSuspend.body.message);

  const demoUsers = await api('GET', '/api/users?search=ananya', { token: admin });
  const touchDemo = await api('PATCH', `/api/users/${demoUsers.body.data[0]._id}`, { token: admin, body: { role: 'student' } });
  check('demo accounts protected from modification', touchDemo.status === 400, touchDemo.body.message);

  const promote = await api('PATCH', `/api/users/${victimId}`, { token: admin, body: { status: 'active', role: 'instructor' } });
  check('admin changes a user role', promote.status === 200 && promote.body.data.role === 'instructor');

  // Delete guards and cascade
  const deleteWithStudents = await api('DELETE', `/api/courses/${courseId}`, { token: instructor });
  check('instructor cannot delete a course with students', deleteWithStudents.status === 409, deleteWithStudents.body.message?.slice(0, 50));

  const adminDelete = await api('DELETE', `/api/courses/${courseId}`, { token: admin });
  check('admin can delete a course with students', adminDelete.status === 200);

  const goneDetail = await api('GET', `/api/courses/${courseId}`, { token: admin });
  check('deleted course is gone', goneDetail.status === 404);

  const orphanLesson = await api('GET', `/api/lessons/${l1.body.data._id}`, { token: instructor });
  check('cascade removed its lessons', orphanLesson.status === 404);

  const orphanQuiz = await api('GET', `/api/quizzes/${quizId}`, { token: instructor });
  check('cascade removed its quiz', orphanQuiz.status === 404);

  const cleanup = await api('DELETE', `/api/courses/${c2Id}`, { token: instructor });
  check('instructor deletes their own empty course', cleanup.status === 200);

  await api('DELETE', `/api/users/${victimId}`, { token: admin });

  console.log(`\n=== ${pass} passed, ${fail} failed ===\n`);
  process.exit(fail > 0 ? 1 : 0);
})().catch((err) => {
  console.error('\nTEST HARNESS ERROR:', err);
  process.exit(1);
});
