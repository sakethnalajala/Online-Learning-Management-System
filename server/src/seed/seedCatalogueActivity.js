/**
 * Gives the wider catalogue real activity.
 *
 * Without this, the 69 catalogue courses would all show zero students and no
 * rating, which makes the browse page look dead and leaves every chart empty.
 * Rather than writing counters directly — which the resync would correctly
 * wipe — this creates genuine enrolments, progress and reviews through the
 * same services the API uses, on a deterministic subset of courses.
 */

const { Enrollment, Progress, Review, Lesson } = require('../models');
const enrollmentService = require('../services/enrollmentService');
const progressService = require('../services/progressService');
const courseService = require('../services/courseService');
const Course = require('../models/Course');

/** Deterministic PRNG so a reseed yields the same catalogue state. */
function makeRandom(seed) {
  let value = 0;
  for (let i = 0; i < seed.length; i += 1) value = (value * 31 + seed.charCodeAt(i)) % 1000003;
  return () => {
    value = (value * 1103515245 + 12345) % 2147483648;
    return value / 2147483648;
  };
}

/** Short, specific review bodies keyed to the rating. */
const REVIEW_TEXT = {
  5: [
    'Genuinely well structured. The explanations go past "how" into "why", which is what I was missing from other material on this.',
    'Paced properly and nothing is hand-waved. I went back to work on Monday and used two things from it the same day.',
    'The best treatment of this topic I have found. It respects that you can already program and gets to the substance.',
  ],
  4: [
    'Strong content and a clear structure. I would have liked more worked examples in the later sections, but what is here is solid.',
    'Very good overall. A couple of lessons assume slightly more background than the prerequisites suggest.',
    'Clear and practical. Worth the time, though the last module felt a little rushed compared with the rest.',
  ],
  3: [
    'Useful in parts. The fundamentals are covered well but I wanted more depth on the advanced material.',
    'Decent introduction. If you already know the basics you may find the first half slow going.',
  ],
};

async function seedCatalogueActivity({ catalogueCourses, students, log }) {
  if (!catalogueCourses.length || !students.length) return { enrolled: 0, reviews: 0 };

  let enrolled = 0;
  let reviews = 0;

  // Roughly two thirds of the catalogue has activity; the rest are honestly
  // new, which is what a real platform looks like.
  const active = catalogueCourses.filter((_, index) => index % 3 !== 2);

  for (const [index, course] of active.entries()) {
    const random = makeRandom(course.title);

    // One to four students per course, varying by position in the list so the
    // "most popular" ordering has a real shape rather than being flat.
    const popularity = 1 + Math.floor(random() * 4);

    const lessons = await Lesson.find({ course: course._id, isPublished: true })
      .sort({ order: 1 })
      .lean();
    if (!lessons.length) continue;

    for (let slot = 0; slot < popularity; slot += 1) {
      const student = students[(index * 3 + slot) % students.length];

      const already = await Enrollment.findOne({ student: student._id, course: course._id });
      if (already) continue;

      let enrollment;
      try {
        const populated = await Course.findById(course._id).populate('instructor', 'name');
        const result = await enrollmentService.enroll({ student, course: populated });
        enrollment = result.enrollment;
        enrolled += 1;
      } catch {
        // Enrolling in your own course, or a duplicate — skip quietly.
        continue;
      }

      // Paid courses would sit at pending_payment; waive so progress is
      // visible. Recorded as a grant, never as a payment.
      if (enrollment.paymentStatus === 'pending_payment') {
        enrollment.paymentStatus = 'waived';
        enrollment.accessType = 'granted';
        await enrollment.save();
      }

      const progress = await Progress.findOne({ enrollment: enrollment._id });
      if (!progress) continue;

      // How far this student got: some barely started, a few finished.
      const fraction = [0, 0.2, 0.45, 0.7, 1][Math.floor(random() * 5)];
      const target = Math.round(lessons.length * fraction);

      for (const lesson of lessons.slice(0, target)) {
        await progressService.markLessonComplete(progress, lesson, {
          watchedSeconds: (lesson.durationMinutes || 10) * 60,
        });
      }

      // Students who got meaningfully into a course sometimes review it.
      if (fraction >= 0.45 && random() > 0.35) {
        const rating = random() > 0.75 ? 4 : random() > 0.15 ? 5 : 3;
        const pool = REVIEW_TEXT[rating];
        const comment = pool[Math.floor(random() * pool.length)];

        try {
          await Review.create({
            course: course._id,
            student: student._id,
            rating,
            comment,
          });
          reviews += 1;
        } catch {
          // One review per student per course — the index refuses a duplicate.
        }
      }
    }

    await courseService.syncCourseRating(course._id);
    await courseService.syncEnrollmentCount(course._id);
  }

  log(`  ${enrolled} catalogue enrolments, ${reviews} catalogue reviews`);
  return { enrolled, reviews };
}

module.exports = { seedCatalogueActivity };
