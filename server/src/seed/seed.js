/**
 * Seeds a complete, demonstrable LMS.
 *
 * Nothing here is faked at the presentation layer: enrolments, progress,
 * quiz attempts, completions and certificates are all produced by running the
 * same service functions the API uses, so the seeded state is exactly the state
 * the application would reach through the UI.
 *
 *   npm run seed         upsert demo data, keep anything already there
 *   npm run seed:fresh   wipe the collections first
 */

const mongoose = require('mongoose');
const env = require('../config/env');
const { connectDB, disconnectDB, describeTarget, assertOwnDatabase } = require('../config/db');
const {
  User,
  Category,
  Course,
  Module,
  Lesson,
  Resource,
  Enrollment,
  Progress,
  Quiz,
  Question,
  QuizAttempt,
  Review,
  Certificate,
  Notification,
} = require('../models');
const { uniqueSlug } = require('../utils/slug');
const { ROLES, COURSE_STATUS } = require('../config/constants');
const progressService = require('../services/progressService');
const courseService = require('../services/courseService');
const quizService = require('../services/quizService');
const enrollmentService = require('../services/enrollmentService');
const data = require('./seedData');
const { backdate } = require('./backdate');
const { catalogue } = require('./catalogue');
const { seedCatalogue } = require('./seedCatalogue');
const { seedCatalogueActivity } = require('./seedCatalogueActivity');

const FRESH = process.argv.includes('--fresh');
const PASSWORDS = env.demoPasswords;

const log = (...args) => console.log('[seed]', ...args);

/* ── Helpers ─────────────────────────────────────────────────────────────── */

async function wipe() {
  // Hard stop if we are not in this application's own database. Each call
  // below is a model-scoped deleteMany, so it can only ever clear this app's
  // 14 collections — but a mistyped URI should fail loudly, not quietly clear
  // the right collection names in the wrong database.
  const db = assertOwnDatabase('a full reseed');
  log(`wiping the ${db} database's LMS collections...`);
  await Promise.all([
    Notification.deleteMany({}),
    Certificate.deleteMany({}),
    Review.deleteMany({}),
    QuizAttempt.deleteMany({}),
    Question.deleteMany({}),
    Quiz.deleteMany({}),
    Progress.deleteMany({}),
    Enrollment.deleteMany({}),
    Resource.deleteMany({}),
    Lesson.deleteMany({}),
    Module.deleteMany({}),
    Course.deleteMany({}),
    Category.deleteMany({}),
    User.deleteMany({}),
  ]);
}

/**
 * Creates or updates a user. Passwords go through the model so the pre-save
 * bcrypt hook runs — the demo accounts must log in through the real auth path.
 */
async function upsertUser(payload) {
  // Each role has its own demo password, so the credentials shown on the
  // role-specific login screens are the ones actually stored.
  const password = PASSWORDS[payload.role] || PASSWORDS.student;
  const existing = await User.findOne({ email: payload.email.toLowerCase() });

  if (existing) {
    Object.assign(existing, { ...payload, email: existing.email });
    existing.password = password; // re-hashed by the pre-save hook
    await existing.save();
    return existing;
  }

  return User.create({ ...payload, password });
}

/* ── Seed steps ──────────────────────────────────────────────────────────── */

async function seedUsers() {
  log('seeding users...');

  const admin = await upsertUser({
    name: 'Platform Admin',
    email: 'admin@lumina.dev',
    role: ROLES.ADMIN,
    isDemo: true,
    headline: 'Lumina platform administrator',
    bio: 'Oversees course approvals, categories and platform health.',
    avatar: 'https://ui-avatars.com/api/?name=Platform+Admin&background=7c3aed&color=fff',
  });

  // The demo instructor and student are the first of each list, flagged so the
  // login screen can advertise them.
  const instructors = [];
  for (const [index, instructor] of data.instructors.entries()) {
    // eslint-disable-next-line no-await-in-loop
    const user = await upsertUser({
      ...instructor,
      role: ROLES.INSTRUCTOR,
      isDemo: index === 0,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(instructor.name)}&background=6d28d9&color=fff`,
    });
    instructors.push(user);
  }

  const students = [];
  for (const [index, student] of data.students.entries()) {
    // eslint-disable-next-line no-await-in-loop
    const user = await upsertUser({
      ...student,
      role: ROLES.STUDENT,
      isDemo: index === 0,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=4f46e5&color=fff`,
    });
    students.push(user);
  }

  log(`  admin: 1, instructors: ${instructors.length}, students: ${students.length}`);
  return { admin, instructors, students };
}

async function seedCategories(admin) {
  log('seeding categories...');
  const map = new Map();

  for (const category of data.categories) {
    // eslint-disable-next-line no-await-in-loop
    let doc = await Category.findOne({ name: category.name });
    if (doc) {
      Object.assign(doc, category);
      // eslint-disable-next-line no-await-in-loop
      await doc.save();
    } else {
      // eslint-disable-next-line no-await-in-loop
      doc = await Category.create({
        ...category,
        // eslint-disable-next-line no-await-in-loop
        slug: await uniqueSlug(Category, category.name),
        createdBy: admin._id,
      });
    }
    map.set(category.name, doc);
  }

  log(`  ${map.size} categories`);
  return map;
}

/** Builds one course with its full module → lesson → resource → quiz tree. */
async function seedCourse(spec, { instructorsByEmail, categoriesByName, admin }) {
  const instructor = instructorsByEmail.get(spec.instructorEmail);
  const category = categoriesByName.get(spec.categoryName);

  if (!instructor || !category) {
    log(`  ! skipping "${spec.title}" (missing instructor or category)`);
    return null;
  }

  let course = await Course.findOne({ title: spec.title });

  const fields = {
    title: spec.title,
    subtitle: spec.subtitle || '',
    description: spec.description,
    thumbnail: spec.thumbnail || '',
    instructor: instructor._id,
    category: category._id,
    level: spec.level || 'beginner',
    tags: spec.tags || [],
    whatYouWillLearn: spec.whatYouWillLearn || [],
    requirements: spec.requirements || [],
    // Every course on Lumina is free. The isFree/price fields on a few specs
    // are ignored on purpose, so a reseed cannot reintroduce a paid course.
    isFree: true,
    price: 0,
    discountPrice: 0,
    currency: 'INR',
    status: spec.status || COURSE_STATUS.DRAFT,
    isFeatured: spec.isFeatured === true,
    rejectionReason: spec.rejectionReason || '',
  };

  // Timestamps consistent with the lifecycle state being represented.
  const now = Date.now();
  if (['pending', 'approved', 'published', 'unpublished', 'rejected'].includes(fields.status)) {
    fields.submittedAt = new Date(now - 6 * 24 * 60 * 60 * 1000);
  }
  if (['approved', 'published', 'unpublished', 'rejected'].includes(fields.status)) {
    fields.reviewedAt = new Date(now - 4 * 24 * 60 * 60 * 1000);
    fields.reviewedBy = admin._id;
  }
  if (fields.status === COURSE_STATUS.PUBLISHED) {
    fields.publishedAt = new Date(now - 4 * 24 * 60 * 60 * 1000);
  }

  if (course) {
    Object.assign(course, fields);
    await course.save();
    // Rebuild the tree so edits to seedData are reflected rather than duplicated.
    const lessonIds = (await Lesson.find({ course: course._id }).select('_id').lean()).map((l) => l._id);
    const quizIds = (await Quiz.find({ course: course._id }).select('_id').lean()).map((q) => q._id);
    await Promise.all([
      Question.deleteMany({ quiz: { $in: quizIds } }),
      Quiz.deleteMany({ course: course._id }),
      Resource.deleteMany({ course: course._id }),
      Lesson.deleteMany({ _id: { $in: lessonIds } }),
      Module.deleteMany({ course: course._id }),
    ]);
  } else {
    course = await Course.create({ ...fields, slug: await uniqueSlug(Course, spec.title) });
  }

  for (const [moduleIndex, moduleSpec] of (spec.modules || []).entries()) {
    // eslint-disable-next-line no-await-in-loop
    const module = await Module.create({
      course: course._id,
      title: moduleSpec.title,
      description: moduleSpec.description || '',
      order: moduleIndex,
      isPublished: true,
    });

    for (const [lessonIndex, lessonSpec] of (moduleSpec.lessons || []).entries()) {
      const videoProvider = lessonSpec.videoUrl
        ? /youtu\.?be/i.test(lessonSpec.videoUrl)
          ? 'youtube'
          : 'external'
        : 'none';

      // eslint-disable-next-line no-await-in-loop
      const lesson = await Lesson.create({
        course: course._id,
        module: module._id,
        title: lessonSpec.title,
        summary: lessonSpec.summary || '',
        content: lessonSpec.content || '',
        type: lessonSpec.videoUrl ? 'video' : 'article',
        videoUrl: lessonSpec.videoUrl || '',
        videoProvider,
        durationMinutes: lessonSpec.durationMinutes || 10,
        order: lessonIndex,
        isPreview: lessonSpec.isPreview === true,
        isPublished: true,
        hasQuiz: Boolean(lessonSpec.quiz),
      });

      for (const [resourceIndex, resourceSpec] of (lessonSpec.resources || []).entries()) {
        // eslint-disable-next-line no-await-in-loop
        await Resource.create({
          course: course._id,
          lesson: lesson._id,
          title: resourceSpec.title,
          description: resourceSpec.description || '',
          type: resourceSpec.type,
          url: resourceSpec.url || '',
          textContent: resourceSpec.textContent || '',
          order: resourceIndex,
          uploadedBy: instructor._id,
        });
      }

      // eslint-disable-next-line no-await-in-loop
      await Lesson.findByIdAndUpdate(lesson._id, {
        resourceCount: (lessonSpec.resources || []).length,
      });

      if (lessonSpec.quiz) {
        const quizSpec = lessonSpec.quiz;
        // eslint-disable-next-line no-await-in-loop
        const quiz = await Quiz.create({
          course: course._id,
          lesson: lesson._id,
          title: quizSpec.title,
          description: quizSpec.description || '',
          passingScore: quizSpec.passingScore ?? 60,
          timeLimitMinutes: quizSpec.timeLimitMinutes ?? 0,
          maxAttempts: quizSpec.maxAttempts ?? 0,
          isRequiredForCompletion: quizSpec.isRequiredForCompletion === true,
          isPublished: true,
          createdBy: instructor._id,
        });

        for (const [questionIndex, questionSpec] of (quizSpec.questions || []).entries()) {
          // eslint-disable-next-line no-await-in-loop
          await Question.create({
            quiz: quiz._id,
            course: course._id,
            text: questionSpec.text,
            type: questionSpec.type || 'single',
            options: questionSpec.options,
            explanation: questionSpec.explanation || '',
            points: questionSpec.points || 1,
            order: questionIndex,
          });
        }

        // eslint-disable-next-line no-await-in-loop
        await quizService.syncQuizStats(quiz._id);
      }

      // eslint-disable-next-line no-await-in-loop
      await Module.findByIdAndUpdate(module._id, {
        lessonCount: await Lesson.countDocuments({ module: module._id }),
        durationMinutes: (
          await Lesson.find({ module: module._id }).select('durationMinutes').lean()
        ).reduce((sum, l) => sum + l.durationMinutes, 0),
      });
    }
  }

  await progressService.syncCourseStats(course._id);
  return course;
}

async function seedCourses(context) {
  log('seeding courses, modules, lessons, resources and quizzes...');
  const courses = [];

  for (const spec of data.courses) {
    // eslint-disable-next-line no-await-in-loop
    const course = await seedCourse(spec, context);
    if (course) courses.push(course);
  }

  log(`  ${courses.length} courses`);
  return courses;
}

/**
 * Enrols students and walks them through real progress: lessons completed via
 * progressService, quizzes graded via quizService. One student is taken all the
 * way to 100% so a genuine certificate exists.
 */
async function seedLearning({ students, courses }) {
  log('seeding enrolments, progress, quiz attempts and certificates...');

  const live = courses.filter((c) => c.status === COURSE_STATUS.PUBLISHED);
  if (!live.length) return;

  // How far through each course a student gets. `1` means full completion.
  const plan = [
    { studentIndex: 0, courseIndex: 0, fraction: 1 },      // Kavya completes React
    { studentIndex: 0, courseIndex: 1, fraction: 0.5 },
    { studentIndex: 0, courseIndex: 2, fraction: 0.25 },
    { studentIndex: 1, courseIndex: 0, fraction: 0.6 },
    { studentIndex: 1, courseIndex: 5, fraction: 0.35 },
    { studentIndex: 2, courseIndex: 0, fraction: 0.8 },
    { studentIndex: 2, courseIndex: 3, fraction: 1 },      // Sara completes Design
    { studentIndex: 3, courseIndex: 2, fraction: 0.45 },
    { studentIndex: 4, courseIndex: 2, fraction: 1 },      // Nikita completes Python
    { studentIndex: 5, courseIndex: 1, fraction: 0.3 },
    { studentIndex: 5, courseIndex: 4, fraction: 0.2 },
    { studentIndex: 3, courseIndex: 0, fraction: 0.15 },
    { studentIndex: 4, courseIndex: 0, fraction: 0.55 },
    { studentIndex: 5, courseIndex: 5, fraction: 0.5 },
  ];

  let enrolled = 0;
  let completed = 0;
  let attempts = 0;

  for (const step of plan) {
    const student = students[step.studentIndex];
    const course = live[step.courseIndex];
    if (!student || !course) continue;

    // eslint-disable-next-line no-await-in-loop
    const already = await Enrollment.findOne({ student: student._id, course: course._id });
    let enrollment = already;

    if (!enrollment) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const populated = await Course.findById(course._id).populate('instructor', 'name');
        // eslint-disable-next-line no-await-in-loop
        const result = await enrollmentService.enroll({ student, course: populated });
        enrollment = result.enrollment;
        enrolled += 1;
      } catch (err) {
        log(`  ! could not enrol ${student.email} in "${course.title}": ${err.message}`);
        continue;
      }
    }

    // Paid courses would sit at pending_payment; waive it so the demo has
    // progress to show. This is an explicit grant, not a pretend payment.
    if (enrollment.paymentStatus === 'pending_payment') {
      enrollment.paymentStatus = 'waived';
      enrollment.accessType = 'granted';
      // eslint-disable-next-line no-await-in-loop
      await enrollment.save();
    }

    // eslint-disable-next-line no-await-in-loop
    const progress = await Progress.findOne({ enrollment: enrollment._id });
    if (!progress) continue;

    // eslint-disable-next-line no-await-in-loop
    const lessons = await Lesson.find({ course: course._id, isPublished: true })
      .sort({ order: 1 })
      .lean();

    const target = Math.max(1, Math.round(lessons.length * step.fraction));
    const toComplete = lessons.slice(0, step.fraction >= 1 ? lessons.length : target);

    for (const lessonDoc of toComplete) {
      // A lesson gated behind a required quiz needs a genuine passing attempt
      // first, exactly as the API would demand.
      // eslint-disable-next-line no-await-in-loop
      const quiz = await Quiz.findOne({ lesson: lessonDoc._id, isPublished: true });

      if (quiz) {
        // eslint-disable-next-line no-await-in-loop
        const questions = await Question.find({ quiz: quiz._id }).sort({ order: 1 });
        if (questions.length) {
          // eslint-disable-next-line no-await-in-loop
          const used = await QuizAttempt.countDocuments({ quiz: quiz._id, student: student._id });

          if (used === 0) {
            // Mostly-correct answers, so scores vary realistically but pass.
            const wrongEvery = step.fraction >= 1 ? 6 : 4;
            const submitted = questions.map((question, index) => {
              const correct = question.correctOptionIds();
              const deliberatelyWrong = index > 0 && index % wrongEvery === 0;

              if (deliberatelyWrong) {
                const wrong = question.options.find((o) => !o.isCorrect);
                return {
                  questionId: String(question._id),
                  selectedOptionIds: wrong ? [String(wrong._id)] : correct,
                };
              }
              return { questionId: String(question._id), selectedOptionIds: correct };
            });

            const graded = quizService.grade(questions, submitted);

            // eslint-disable-next-line no-await-in-loop
            await QuizAttempt.create({
              quiz: quiz._id,
              lesson: lessonDoc._id,
              course: course._id,
              student: student._id,
              enrollment: enrollment._id,
              answers: graded.answers,
              attemptNumber: 1,
              score: graded.score,
              pointsEarned: graded.pointsEarned,
              totalPoints: graded.totalPoints,
              correctCount: graded.correctCount,
              questionCount: questions.length,
              passed: graded.score >= quiz.passingScore,
              passingScore: quiz.passingScore,
              timeSpentSeconds: 120 + questions.length * 25,
            });
            attempts += 1;
          }
        }
      }

      // eslint-disable-next-line no-await-in-loop
      const result = await progressService.markLessonComplete(progress, lessonDoc, {
        watchedSeconds: (lessonDoc.durationMinutes || 10) * 60,
      });
      if (result.justCompleted) completed += 1;
    }
  }

  log(`  ${enrolled} new enrolments, ${attempts} quiz attempts, ${completed} course completions`);
}

async function seedReviews({ students, courses }) {
  log('seeding reviews and ratings...');
  let count = 0;

  const studentsByEmail = new Map(students.map((s) => [s.email, s]));

  for (const spec of data.reviews) {
    const student = studentsByEmail.get(spec.studentEmail);
    const course = courses.find((c) => c.title.startsWith(spec.courseTitleStartsWith));
    if (!student || !course) continue;

    // Reviews require an enrolment, same rule the API enforces.
    // eslint-disable-next-line no-await-in-loop
    const enrolled = await Enrollment.exists({ student: student._id, course: course._id });
    if (!enrolled) continue;

    // eslint-disable-next-line no-await-in-loop
    const existing = await Review.findOne({ student: student._id, course: course._id });
    if (existing) continue;

    // eslint-disable-next-line no-await-in-loop
    await Review.create({
      course: course._id,
      student: student._id,
      rating: spec.rating,
      title: spec.title || '',
      comment: spec.comment || '',
    });
    count += 1;
  }

  // Recompute every course's rating from the reviews just written.
  for (const course of courses) {
    // eslint-disable-next-line no-await-in-loop
    await courseService.syncCourseRating(course._id);
    // eslint-disable-next-line no-await-in-loop
    await courseService.syncEnrollmentCount(course._id);
  }

  log(`  ${count} reviews`);
}

async function seedAdminNotifications({ admin, courses }) {
  const pending = courses.filter((c) => c.status === COURSE_STATUS.PENDING);
  if (!pending.length) return;

  const notifications = require('../services/notificationService');

  for (const course of pending) {
    // eslint-disable-next-line no-await-in-loop
    const exists = await Notification.exists({
      user: admin._id,
      course: course._id,
      type: 'course_approval',
    });
    if (exists) continue;

    // eslint-disable-next-line no-await-in-loop
    const instructor = await User.findById(course.instructor).select('name').lean();
    // eslint-disable-next-line no-await-in-loop
    await notifications.onCourseSubmitted({
      adminIds: [admin._id],
      course,
      instructorName: instructor?.name || 'An instructor',
    });
  }
}

/* ── Summary ─────────────────────────────────────────────────────────────── */

async function printSummary() {
  const [users, categories, courses, modules, lessons, resources, quizzes, questions, enrollments, attempts, reviews, certificates, notifications] =
    await Promise.all([
      User.countDocuments(),
      Category.countDocuments(),
      Course.countDocuments(),
      Module.countDocuments(),
      Lesson.countDocuments(),
      Resource.countDocuments(),
      Quiz.countDocuments(),
      Question.countDocuments(),
      Enrollment.countDocuments(),
      QuizAttempt.countDocuments(),
      Review.countDocuments(),
      Certificate.countDocuments(),
      Notification.countDocuments(),
    ]);

  const demo = await User.find({ isDemo: true }).select('name email role').sort({ role: 1 }).lean();

  const line = '-'.repeat(62);
  console.log(`\n${line}`);
  console.log('  SEED COMPLETE');
  console.log(line);
  console.log(`  users ${users}   categories ${categories}   courses ${courses}`);
  console.log(`  modules ${modules}   lessons ${lessons}   resources ${resources}`);
  console.log(`  quizzes ${quizzes}   questions ${questions}   quiz attempts ${attempts}`);
  console.log(`  enrolments ${enrollments}   reviews ${reviews}   certificates ${certificates}`);
  console.log(`  notifications ${notifications}`);
  console.log(line);
  console.log('  DEMO LOGINS (a different password per role)');
  console.log(line);
  for (const user of demo) {
    console.log(
      `  ${user.role.padEnd(11)} ${user.email.padEnd(30)} ${PASSWORDS[user.role] || ''}`
    );
  }
  console.log(`${line}\n`);
}

/* ── Main ────────────────────────────────────────────────────────────────── */

async function main() {
  console.log(`\n[seed] host     ${describeTarget(env.mongoUri)}`);
  console.log(`[seed] database ${env.mongoDbName}`);
  await connectDB();

  if (FRESH) await wipe();

  const { admin, instructors, students } = await seedUsers();
  const categoriesByName = await seedCategories(admin);
  const instructorsByEmail = new Map(instructors.map((i) => [i.email, i]));

  const authored = await seedCourses({ instructorsByEmail, categoriesByName, admin });

  // The wider catalogue: distinct subjects expanded into full content trees.
  log('seeding the wider course catalogue...');
  const catalogueCourses = await seedCatalogue({
    catalogue,
    instructors,
    categoriesByName,
    admin,
    log,
  });
  log(`  ${catalogueCourses.length} catalogue courses`);

  const courses = [...authored, ...catalogueCourses];

  await seedLearning({ students, courses });
  await seedReviews({ students, courses });

  // Give the wider catalogue genuine enrolments, progress and ratings.
  log('seeding catalogue activity...');
  await seedCatalogueActivity({ catalogueCourses, students, log });
  await seedAdminNotifications({ admin, courses });

  // Everything above lands with today's timestamp; spread it over the last few
  // weeks so the trend charts on every dashboard have something real to plot.
  log('backdating records so analytics have history...');
  const spreadCounts = await backdate();
  log(`  ${spreadCounts.users} users, ${spreadCounts.courses} courses, ${spreadCounts.enrollments} enrolments`);

  await printSummary();
  await disconnectDB();
  process.exit(0);
}

main().catch(async (err) => {
  console.error('\n[seed] failed:', err);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
