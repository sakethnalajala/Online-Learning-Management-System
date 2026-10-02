import { Suspense, lazy, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import PublicLayout from './components/layout/PublicLayout';
import DashboardLayout from './components/layout/DashboardLayout';
import { GuestRoute, ProtectedRoute, RoleRoute } from './components/layout/ProtectedRoute';
import { PageLoader } from './components/ui';
import { ROLES } from './context/AuthContext';

/* Public */
const Landing = lazy(() => import('./pages/public/Landing'));
const Courses = lazy(() => import('./pages/public/Courses'));
const CourseDetail = lazy(() => import('./pages/public/CourseDetail'));
const InstructorProfile = lazy(() => import('./pages/public/InstructorProfile'));
const VerifyCertificate = lazy(() => import('./pages/public/VerifyCertificate'));
const NotFound = lazy(() => import('./pages/public/NotFound'));

/* Auth */
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const GetStarted = lazy(() => import('./pages/auth/GetStarted'));

/* Student */
const StudentDashboard = lazy(() => import('./pages/student/Dashboard'));
const MyCourses = lazy(() => import('./pages/student/MyCourses'));
const Learn = lazy(() => import('./pages/student/Learn'));
const QuizResults = lazy(() => import('./pages/student/QuizResults'));
const Certificates = lazy(() => import('./pages/student/Certificates'));
const CertificateView = lazy(() => import('./pages/student/CertificateView'));
const MyReviews = lazy(() => import('./pages/student/MyReviews'));

/* Instructor */
const InstructorDashboard = lazy(() => import('./pages/instructor/Dashboard'));
const InstructorCourses = lazy(() => import('./pages/instructor/Courses'));
const CourseBuilder = lazy(() => import('./pages/instructor/CourseBuilder'));
const CourseStudents = lazy(() => import('./pages/instructor/CourseStudents'));
const InstructorStudents = lazy(() => import('./pages/instructor/Students'));
const IssuedCertificates = lazy(() => import('./pages/instructor/IssuedCertificates'));

/* Admin */
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminCourses = lazy(() => import('./pages/admin/Courses'));
const Approvals = lazy(() => import('./pages/admin/Approvals'));
const AdminUsers = lazy(() => import('./pages/admin/Users'));
const AdminCategories = lazy(() => import('./pages/admin/Categories'));
const AdminEnrollments = lazy(() => import('./pages/admin/Enrollments'));
const AdminResources = lazy(() => import('./pages/admin/Resources'));
const AdminCertificates = lazy(() => import('./pages/admin/Certificates'));
const AdminProfileSettings = lazy(() => import('./pages/admin/ProfileSettings'));

/* Shared across roles */
const Profile = lazy(() => import('./pages/shared/Profile'));
const Notifications = lazy(() => import('./pages/shared/Notifications'));

/** Returns to the top of the page on navigation, which routers do not do. */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ── Public ─────────────────────────────────────────────────── */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/:idOrSlug" element={<CourseDetail />} />
            <Route path="/instructors/:id" element={<InstructorProfile />} />
            <Route path="/verify" element={<VerifyCertificate />} />
            <Route path="/verify/:code" element={<VerifyCertificate />} />
          </Route>

          {/* ── Auth (redirects away when already signed in) ────────────── */}
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<Login />} />
            {/* Role-specific sign-in, linked from the homepage header. */}
            <Route path="/login/:role" element={<Login />} />
            <Route path="/get-started" element={<GetStarted />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* ── Authenticated ──────────────────────────────────────────── */}
          <Route element={<ProtectedRoute />}>
            {/* The learning interface is full-bleed, outside the dashboard shell. */}
            <Route path="/learn/:courseId" element={<Learn />} />

            {/* Student */}
            <Route element={<RoleRoute allow={[ROLES.STUDENT]} />}>
              <Route path="/student" element={<DashboardLayout />}>
                <Route index element={<StudentDashboard />} />
                <Route path="courses" element={<MyCourses />} />
                <Route path="quizzes" element={<QuizResults />} />
                <Route path="certificates" element={<Certificates />} />
                <Route path="certificates/:id" element={<CertificateView />} />
                <Route path="reviews" element={<MyReviews />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="profile" element={<Profile />} />
              </Route>
            </Route>

            {/* Instructor */}
            <Route element={<RoleRoute allow={[ROLES.INSTRUCTOR, ROLES.ADMIN]} />}>
              <Route path="/instructor" element={<DashboardLayout />}>
                <Route index element={<InstructorDashboard />} />
                <Route path="courses" element={<InstructorCourses />} />
                <Route path="courses/:id" element={<CourseBuilder />} />
                <Route path="courses/:id/students" element={<CourseStudents />} />
                <Route path="students" element={<InstructorStudents />} />
                <Route path="certificates" element={<IssuedCertificates />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="profile" element={<Profile />} />
              </Route>
            </Route>

            {/* Admin */}
            <Route element={<RoleRoute allow={[ROLES.ADMIN]} />}>
              <Route path="/admin" element={<DashboardLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="courses" element={<AdminCourses />} />
                <Route path="approvals" element={<Approvals />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="enrollments" element={<AdminEnrollments />} />
                <Route path="resources" element={<AdminResources />} />
                <Route path="certificates" element={<AdminCertificates />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="profile" element={<AdminProfileSettings />} />
              </Route>
            </Route>
          </Route>

          {/* ── Fallbacks ──────────────────────────────────────────────── */}
          <Route path="/dashboard" element={<Navigate to="/student" replace />} />
          <Route element={<PublicLayout />}>
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}
