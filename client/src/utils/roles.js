import { GraduationCap, ShieldCheck, UserCog } from 'lucide-react';

/**
 * Presentation metadata for the three roles, shared by the role picker, the
 * role-specific login screens and the registration flow, so the wording and
 * iconography never drift between them.
 *
 * `canRegister` is the frontend half of the rule that admin accounts are never
 * self-served — the API enforces the same thing independently.
 */
export const ROLE_META = {
  student: {
    key: 'student',
    label: 'Student',
    title: 'Student login',
    tagline: 'I want to learn',
    description: 'Enrol in courses, track progress and earn certificates.',
    bullets: ['Enrol in courses', 'Track your progress', 'Earn certificates'],
    icon: GraduationCap,
    accent: 'violet',
    home: '/student',
    canRegister: true,
  },
  instructor: {
    key: 'instructor',
    label: 'Instructor',
    title: 'Instructor login',
    tagline: 'I want to teach',
    description: 'Create courses, write lessons and quizzes, and monitor students.',
    bullets: ['Create courses', 'Write lessons and quizzes', 'Monitor your students'],
    icon: UserCog,
    accent: 'cyan',
    home: '/instructor',
    canRegister: true,
  },
  admin: {
    key: 'admin',
    label: 'Admin',
    title: 'Administrator login',
    tagline: 'I manage the platform',
    description: 'Approve courses, manage users and monitor platform health.',
    bullets: ['Review and approve courses', 'Manage users and categories', 'Monitor the platform'],
    icon: ShieldCheck,
    accent: 'amber',
    home: '/admin',
    canRegister: false,
  },
};

export const ROLE_ORDER = ['student', 'instructor', 'admin'];

/** Roles a visitor may sign themselves up as. */
export const REGISTERABLE_ROLES = ROLE_ORDER.filter((role) => ROLE_META[role].canRegister);

/** Tailwind classes per accent, kept here so the three surfaces agree. */
export const ACCENT_CLASSES = {
  violet: {
    icon: 'bg-violet-500/15 text-violet-300 ring-violet-500/25',
    ring: 'border-violet-500 ring-violet-500/25',
    text: 'text-violet-300',
    dot: 'bg-violet-500',
  },
  cyan: {
    icon: 'bg-cyan-500/15 text-accent-cyan ring-cyan-500/25',
    ring: 'border-cyan-500 ring-cyan-500/25',
    text: 'text-accent-cyan',
    dot: 'bg-cyan-500',
  },
  amber: {
    icon: 'bg-amber-500/15 text-accent-amber ring-amber-500/25',
    ring: 'border-amber-500 ring-amber-500/25',
    text: 'text-accent-amber',
    dot: 'bg-amber-500',
  },
};

export const roleMeta = (role) => ROLE_META[role] || ROLE_META.student;
