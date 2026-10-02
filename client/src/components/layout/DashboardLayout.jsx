import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import {
  Award,
  BarChart3,
  Bell,
  BookMarked,
  BookOpen,
  ClipboardList,
  FolderTree,
  GraduationCap,
  Home,
  LayoutDashboard,
  Layers,
  ListChecks,
  Menu,
  Search,
  Star,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import { useAuth, ROLES } from '../../context/AuthContext';
import Brand from './Brand';
import UserMenu from './UserMenu';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';

/**
 * Navigation per role. `end` marks the index route so the dashboard link does
 * not stay highlighted on every child page.
 */
const NAV = {
  [ROLES.STUDENT]: [
    { to: '/student', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/student/courses', label: 'My courses', icon: BookMarked },
    { to: '/courses', label: 'Browse catalogue', icon: Search },
    { to: '/student/quizzes', label: 'Quiz results', icon: ListChecks },
    { to: '/student/certificates', label: 'Certificates', icon: Award },
    { to: '/student/reviews', label: 'My reviews', icon: Star },
    { to: '/student/notifications', label: 'Notifications', icon: Bell },
    { to: '/student/profile', label: 'Profile settings', icon: UserCog },
  ],
  [ROLES.INSTRUCTOR]: [
    { to: '/instructor', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/instructor/courses', label: 'My courses', icon: BookOpen },
    { to: '/instructor/students', label: 'Students', icon: GraduationCap },
    { to: '/instructor/certificates', label: 'Certificates issued', icon: Award },
    { to: '/instructor/notifications', label: 'Notifications', icon: Bell },
    { to: '/instructor/profile', label: 'Profile settings', icon: UserCog },
  ],
  [ROLES.ADMIN]: [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/admin/courses', label: 'Courses', icon: BookOpen },
    { to: '/admin/approvals', label: 'Approval queue', icon: ClipboardList },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/categories', label: 'Categories', icon: FolderTree },
    { to: '/admin/enrollments', label: 'Enrolments', icon: Layers },
    { to: '/admin/resources', label: 'Resources', icon: BarChart3 },
    { to: '/admin/certificates', label: 'Certificates', icon: Award },
    { to: '/admin/notifications', label: 'Notifications', icon: Bell },
    { to: '/admin/profile', label: 'Profile settings', icon: UserCog },
  ],
};

/** The 4 destinations that get a bottom bar on phones. */
const MOBILE_BAR = {
  [ROLES.STUDENT]: ['/student', '/student/courses', '/courses', '/student/certificates'],
  [ROLES.INSTRUCTOR]: ['/instructor', '/instructor/courses', '/instructor/students', '/instructor/notifications'],
  [ROLES.ADMIN]: ['/admin', '/admin/courses', '/admin/approvals', '/admin/users'],
};

const ROLE_TITLE = {
  [ROLES.STUDENT]: 'Student',
  [ROLES.INSTRUCTOR]: 'Instructor',
  [ROLES.ADMIN]: 'Admin',
};

export default function DashboardLayout() {
  const { user, role, home } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { pathname } = useLocation();

  const links = NAV[role] || [];
  const barPaths = MOBILE_BAR[role] || [];
  const barLinks = barPaths.map((path) => links.find((link) => link.to === path)).filter(Boolean);

  useEffect(() => setDrawerOpen(false), [pathname]);

  // Lock scroll behind the mobile drawer.
  useEffect(() => {
    if (!drawerOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [drawerOpen]);

  const sidebar = (
    <>
      <div className="flex h-16 shrink-0 items-center justify-between gap-2 px-5">
        <Brand to={home} />
        <button
          type="button"
          onClick={() => setDrawerOpen(false)}
          className="btn-icon lg:hidden"
          aria-label="Close navigation"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="mx-4 mb-4 rounded-xl bg-violet-soft p-3 ring-1 ring-inset ring-violet-500/20">
        <p className="text-2xs font-bold uppercase tracking-wider text-violet-300">
          {ROLE_TITLE[role]} workspace
        </p>
        <p className="mt-0.5 truncate text-sm font-semibold text-white">{user?.name}</p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4" aria-label="Dashboard">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => clsx('nav-link', isActive && 'nav-link-active')}
          >
            <link.icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
            <span className="truncate">{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-ink-700 p-3">
        <Link to="/" className="nav-link">
          <Home className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
          Back to site
        </Link>
      </div>
    </>
  );

  return (
    <div className="min-h-screen lg:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-ink-700/80 bg-ink-850/60 backdrop-blur-xl lg:flex">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 animate-fade-in bg-ink-950/80 backdrop-blur-sm"
          />
          <aside className="relative flex h-full w-[17rem] max-w-[85vw] animate-slide-in-right flex-col border-r border-ink-700 bg-ink-850 shadow-glow-lg">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-ink-700/80 bg-ink-900/85 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="btn-icon lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>

            <div className="lg:hidden">
              <Brand to={home} compact />
            </div>

            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle compact />
              <NotificationBell notificationsPath={`${home}/notifications`} />
              <UserMenu />
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-10">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom bar: the four routes people actually use on a phone. */}
      <nav
        className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-ink-700 bg-ink-900/95 backdrop-blur-xl lg:hidden"
        aria-label="Quick navigation"
      >
        <div className="flex">
          {barLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                clsx(
                  'flex flex-1 flex-col items-center gap-1 px-1 pt-2.5 text-[10px] font-semibold transition-colors',
                  isActive ? 'text-violet-300' : 'text-slate-500'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <link.icon className="h-5 w-5" aria-hidden="true" />
                  <span className="max-w-full truncate">{link.label.split(' ')[0]}</span>
                  <span
                    className={clsx(
                      'h-0.5 w-6 rounded-full transition-colors',
                      isActive ? 'bg-violet-400' : 'bg-transparent'
                    )}
                  />
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
