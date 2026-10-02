/**
 * Expands `catalogue.js` into real courses.
 *
 * Each entry there is a distinct subject with its own outline. This turns that
 * outline into Course -> Module -> Lesson documents, attaches a resource or two
 * per lesson, and builds a quiz where the entry asks for one — so catalogue
 * courses are the same shape as the hand-authored ones and behave identically
 * through enrolment, progress, quizzes and completion.
 */

const { Course, Module, Lesson, Resource, Quiz, Question } = require('../models');
const { uniqueSlug } = require('../utils/slug');
const quizService = require('../services/quizService');
const progressService = require('../services/progressService');
const { COURSE_STATUS } = require('../config/constants');

/** Deterministic pseudo-random so a reseed produces the same catalogue. */
function seededRandom(seed) {
  let value = 0;
  for (let i = 0; i < seed.length; i += 1) value = (value * 31 + seed.charCodeAt(i)) % 1000003;
  return () => {
    value = (value * 1103515245 + 12345) % 2147483648;
    return value / 2147483648;
  };
}

/** A lesson's running time, varied but sensible for its position. */
const durationFor = (random) => 8 + Math.floor(random() * 22);

/**
 * Two generic but genuinely useful questions per generated quiz, phrased
 * against the lesson titles so they are specific to the course rather than
 * filler. Hand-authored courses in seedData.js carry richer quizzes.
 */
function buildQuestions(course, moduleSpec) {
  const first = moduleSpec.lessons[0];
  const last = moduleSpec.lessons[moduleSpec.lessons.length - 1];

  return [
    {
      text: `Which statement best reflects what "${first}" establishes in this course?`,
      type: 'single',
      options: [
        { text: 'It sets up the model the rest of the module builds on', isCorrect: true },
        { text: 'It is optional background with no bearing on later lessons', isCorrect: false },
        { text: 'It only matters for advanced use cases', isCorrect: false },
        { text: 'It duplicates material covered elsewhere', isCorrect: false },
      ],
      explanation: `"${first}" introduces the ideas the following lessons depend on, which is why it comes first.`,
      points: 1,
      order: 0,
    },
    {
      text: `In "${course.title}", why does the module cover "${last}"?`,
      type: 'single',
      options: [
        { text: 'It applies the module\'s ideas to a situation you will actually meet', isCorrect: true },
        { text: 'It is included only for completeness', isCorrect: false },
        { text: 'It replaces the earlier lessons', isCorrect: false },
        { text: 'It is unrelated to the module topic', isCorrect: false },
      ],
      explanation:
        'Each module closes by applying what came before to a realistic case, which is where the ideas are tested.',
      points: 1,
      order: 1,
    },
  ];
}

/** Resources appropriate to the subject, so every lesson has something attached. */
function buildResources(spec, lessonTitle, index) {
  const resources = [
    {
      title: `${lessonTitle} — key points`,
      type: 'text',
      textContent: `Summary for "${lessonTitle}".\n\nWork through the lesson first, then use these notes as a refresher before the next one. Focus on the reasoning rather than memorising the steps: the details change between versions, the model does not.`,
    },
  ];

  // Every other lesson also carries a reference link, keyed to the subject.
  if (index % 2 === 0 && spec.tags?.length) {
    resources.push({
      title: `Further reading: ${spec.tags[0]}`,
      type: 'link',
      url: `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(spec.tags[0])}`,
      description: 'Reference documentation for the topic covered in this lesson.',
    });
  }

  return resources;
}

/**
 * Creates one catalogue course with its full content tree.
 * Returns the course document, or null when it already exists.
 */
async function seedOne(spec, { instructor, category, admin }) {
  const existing = await Course.findOne({ title: spec.title });
  if (existing) return existing;

  const random = seededRandom(spec.title);
  /*
   * Every course on Lumina is free. The `price` on each catalogue entry is
   * left in place as historical metadata but is deliberately not applied —
   * forcing free here means no reseed can reintroduce a paid course.
   */
  const isFree = true;

  const now = Date.now();
  const course = await Course.create({
    title: spec.title,
    slug: await uniqueSlug(Course, spec.title),
    subtitle: spec.subtitle || '',
    description: spec.description,
    thumbnail: spec.thumbnail || '',
    instructor: instructor._id,
    category: category._id,
    level: spec.level || 'beginner',
    language: 'English',
    tags: spec.tags || [],
    whatYouWillLearn: spec.learn || [],
    requirements: spec.requirements || [],
    isFree,
    price: isFree ? 0 : spec.price,
    discountPrice: isFree ? 0 : spec.discount || 0,
    currency: 'INR',
    status: COURSE_STATUS.PUBLISHED,
    submittedAt: new Date(now - 20 * 24 * 60 * 60 * 1000),
    reviewedAt: new Date(now - 18 * 24 * 60 * 60 * 1000),
    reviewedBy: admin._id,
    publishedAt: new Date(now - 18 * 24 * 60 * 60 * 1000),
  });

  for (const [moduleIndex, moduleSpec] of spec.modules.entries()) {
    const module = await Module.create({
      course: course._id,
      title: moduleSpec.title,
      description: '',
      order: moduleIndex,
      isPublished: true,
    });

    let moduleMinutes = 0;

    for (const [lessonIndex, lessonTitle] of moduleSpec.lessons.entries()) {
      const wantsQuiz =
        spec.quizAt &&
        spec.quizAt.module === moduleIndex &&
        lessonIndex === moduleSpec.lessons.length - 1;

      const minutes = durationFor(random);
      moduleMinutes += minutes;

      const lesson = await Lesson.create({
        course: course._id,
        module: module._id,
        title: lessonTitle,
        summary: `${lessonTitle} — part of "${moduleSpec.title}".`,
        content: `# ${lessonTitle}\n\nThis lesson sits in "${moduleSpec.title}" and builds directly on what came before it.\n\nWork through the explanation, then try the idea on your own project rather than only following along. The notes attached to this lesson summarise the points worth remembering, and the further reading goes deeper where you want it.\n\nWhen you are comfortable with the material, mark the lesson complete and move on.`,
        type: 'article',
        videoUrl: '',
        videoProvider: 'none',
        durationMinutes: minutes,
        order: lessonIndex,
        // The very first lesson of a course is a free preview.
        isPreview: moduleIndex === 0 && lessonIndex === 0,
        isPublished: true,
        hasQuiz: Boolean(wantsQuiz),
      });

      const resources = buildResources(spec, lessonTitle, lessonIndex);
      for (const [resourceIndex, resource] of resources.entries()) {
        await Resource.create({
          course: course._id,
          lesson: lesson._id,
          title: resource.title,
          description: resource.description || '',
          type: resource.type,
          url: resource.url || '',
          textContent: resource.textContent || '',
          order: resourceIndex,
          uploadedBy: instructor._id,
        });
      }
      await Lesson.findByIdAndUpdate(lesson._id, { resourceCount: resources.length });

      if (wantsQuiz) {
        const quiz = await Quiz.create({
          course: course._id,
          lesson: lesson._id,
          title: spec.quizAt.title,
          description: `A short check on "${moduleSpec.title}".`,
          passingScore: 60,
          timeLimitMinutes: 0,
          maxAttempts: 0,
          isRequiredForCompletion: spec.quizAt.required === true,
          isPublished: true,
          createdBy: instructor._id,
        });

        for (const question of buildQuestions(spec, moduleSpec)) {
          await Question.create({ quiz: quiz._id, course: course._id, ...question });
        }
        await quizService.syncQuizStats(quiz._id);
      }
    }

    await Module.findByIdAndUpdate(module._id, {
      lessonCount: moduleSpec.lessons.length,
      durationMinutes: moduleMinutes,
    });
  }

  await progressService.syncCourseStats(course._id);
  return course;
}

/**
 * Seeds the whole catalogue, spreading courses across the available
 * instructors so no single account owns everything.
 */
async function seedCatalogue({ catalogue, instructors, categoriesByName, admin, log }) {
  const created = [];

  for (const [index, spec] of catalogue.entries()) {
    const category = categoriesByName.get(spec.categoryName);
    if (!category) {
      log(`  ! skipping "${spec.title}" — unknown category "${spec.categoryName}"`);
      continue;
    }

    // Round-robin so every instructor has a realistic-looking portfolio.
    const instructor = instructors[index % instructors.length];

    const course = await seedOne(spec, { instructor, category, admin });
    if (course) created.push(course);
  }

  return created;
}

module.exports = { seedCatalogue };
