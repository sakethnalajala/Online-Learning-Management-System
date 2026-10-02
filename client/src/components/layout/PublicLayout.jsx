import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { BadgeCheck, LayoutDashboard, LogIn, Menu, Search, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Brand, { APP_NAME } from './Brand';
import UserMenu from './UserMenu';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';
import { ACCENT_CLASSES, ROLE_ORDER, roleMeta } from '../../utils/roles';

const LINKS = [
  { to: '/courses', label: 'Browse courses' },
  { to: '/verify', label: 'Verify certificate' },
];

/** Student | Instructor | Admin, each opening that portal's sign-in screen. */
function RolePortalLinks({ onNavigate, className, stacked = false }) {
  return (
    <div
      className={clsx(
        stacked ? 'grid grid-cols-3 gap-1.5' : 'flex items-center gap-0.5',
        className
      )}
    >
      {ROLE_ORDER.map((key) => {
        const meta = roleMeta(key);
        const accent = ACCENT_CLASSES[meta.accent];
        return (
          <NavLink
            key={key}
            to={`/login/${key}`}
            onClick={onNavigate}
            title={`${meta.label} sign-in`}
            className={({ isActive }) =>
              clsx(
                'flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors',
                stacked && 'flex-col gap-1 py-2.5 text-xs',
                isActive
                  ? clsx('bg-ink-800', accent.text)
                  : 'text-slate-400 hover:bg-ink-800 hover:text-white'
              )
            }
          >
            <meta.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {meta.label}
          </NavLink>
        );
      })}
    </div>
  );
}

export default function PublicLayout() {
  const { isAuthenticated, home } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the mobile sheet whenever the route changes.
  useEffect(() => setMobileOpen(false), [pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <header
        className={clsx(
          'sticky top-0 z-40 border-b transition-all duration-300',
          scrolled
            ? 'border-ink-700/80 bg-ink-900/85 backdrop-blur-xl'
            : 'border-transparent bg-transparent'
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Brand />

          <nav className="ml-3 hidden items-center gap-1 lg:flex" aria-label="Main">
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  clsx(
                    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive ? 'text-white' : 'text-slate-400 hover:text-white'
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {!isAuthenticated && (
              <>
                {/* Role portals, the primary way in from the homepage. */}
                <RolePortalLinks className="hidden xl:flex" />
                <span className="hidden h-5 w-px bg-ink-700 xl:block" aria-hidden="true" />
              </>
            )}

            <ThemeToggle className="hidden sm:inline-flex" />

            <Link to="/courses" className="btn-icon lg:hidden" aria-label="Search courses">
              <Search className="h-[18px] w-[18px]" aria-hidden="true" />
            </Link>

            {isAuthenticated ? (
              <>
                <NotificationBell notificationsPath={`${home}/notifications`} />
                <Link to={home} className="btn-secondary btn-sm hidden sm:inline-flex">
                  <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                  Dashboard
                </Link>
                <UserMenu />
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost hidden sm:inline-flex">
                  <LogIn className="h-4 w-4" aria-hidden="true" />
                  Log in
                </Link>
                <Link to="/get-started" className="btn-primary btn-sm">
                  Get started
                </Link>
              </>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen((value) => !value)}
              className="btn-icon lg:hidden"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="animate-fade-in border-t border-ink-700 bg-ink-900/97 px-4 py-3 backdrop-blur-xl lg:hidden">
            <nav className="flex flex-col gap-1" aria-label="Mobile">
              {LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) => clsx('nav-link', isActive && 'nav-link-active')}
                >
                  {link.label}
                </NavLink>
              ))}

              {!isAuthenticated && (
                <>
                  <p className="mt-3 px-1 text-2xs font-bold uppercase tracking-wider text-slate-500">
                    Sign in as
                  </p>
                  <RolePortalLinks stacked onNavigate={() => setMobileOpen(false)} />

                  <div className="mt-3 flex gap-2 border-t border-ink-700 pt-3">
                    <Link to="/login" className="btn-secondary flex-1">
                      Log in
                    </Link>
                    <Link to="/get-started" className="btn-primary flex-1">
                      Get started
                    </Link>
                  </div>
                </>
              )}

              <div className="mt-3 flex items-center justify-between border-t border-ink-700 pt-3 sm:hidden">
                <span className="text-sm text-slate-400">Theme</span>
                <ThemeToggle />
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-20 border-t border-ink-700/70 bg-ink-950/50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
            <div>
              <Brand />
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500">
                A learning platform built around structured courses, honest progress tracking and
                certificates you can actually verify.
              </p>
              <ThemeToggle className="mt-5" />
            </div>

            <FooterColumn
              title="Learn"
              links={[
                { to: '/courses', label: 'All courses' },
                { to: '/courses?price=free', label: 'Free courses' },
                { to: '/courses?sort=popular', label: 'Most popular' },
                { to: '/courses?sort=rating', label: 'Top rated' },
              ]}
            />
            <FooterColumn
              title="Sign in"
              links={[
                { to: '/login/student', label: 'Student portal' },
                { to: '/login/instructor', label: 'Instructor portal' },
                { to: '/login/admin', label: 'Admin portal' },
              ]}
            />
            <FooterColumn
              title="Platform"
              links={[
                { to: '/verify', label: 'Verify a certificate' },
                { to: '/get-started', label: 'Create an account' },
                { to: '/register?role=instructor', label: 'Become an instructor' },
              ]}
            />
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-ink-800 pt-6 sm:flex-row">
            <p className="text-xs text-slate-600">
              © {new Date().getFullYear()} {APP_NAME}. Built as a full-stack LMS project.
            </p>
            <p className="flex items-center gap-1.5 text-xs text-slate-600">
              <BadgeCheck className="h-3.5 w-3.5 text-violet-500" aria-hidden="true" />
              MERN · JWT auth · MongoDB Atlas
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterColumn({ title, links }) {
  return (
    <div>
      <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">{title}</h4>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={`${link.to}-${link.label}`}>
            <Link to={link.to} className="text-sm text-slate-500 transition-colors hover:text-violet-300">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
