# Lumina — Online Learning Management System

A full-stack LMS built with the MERN stack. Instructors build structured courses,
an administrator reviews them before they go live, and students work through
them with progress tracked against real lesson completion, quizzes graded on the
server, and a certificate that can be publicly verified.

Every feature is wired end to end: creating a course as an instructor really does
flow through to the admin queue, the student catalogue, enrolment, progress,
quiz results, completion and certificate issue. Nothing is mocked in the frontend.

---

## Contents

- [Stack](#stack)
- [Quick start](#quick-start)
- [Demo accounts](#demo-accounts)
- [What the three roles can do](#what-the-three-roles-can-do)
- [Theming](#theming)
- [Navigation](#navigation)
- [Role portals](#role-portals)
- [Profile settings](#profile-settings)
- [The learning workflow](#the-learning-workflow)
- [The course approval workflow](#the-course-approval-workflow)
- [Free and paid courses](#free-and-paid-courses)
- [Data model](#data-model)
- [API reference](#api-reference)
- [Security](#security)
- [Project structure](#project-structure)
- [Environment variables](#environment-variables)
- [Deployment](#deployment)
- [Testing](#testing)

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router 6, Axios, Recharts, lucide-react |
| Theming | CSS custom properties driven by `data-theme`, dark and light, persisted |
| Backend | Node.js, Express 4, REST |
| Database | MongoDB (Atlas-ready) with Mongoose 8 |
| Auth | JWT access + refresh tokens, bcrypt password hashing |
| Uploads | Multer, served from `/uploads` |
| Hardening | Helmet, CORS allow-list, rate limiting, `express-mongo-sanitize`, `express-validator` |
| Deployment | Frontend → Vercel, Backend → Render |

---

## Quick start

**Requirements:** Node 18+, and either a MongoDB Atlas cluster or MongoDB running
locally.

```bash
# 1. Install both workspaces
npm run install:all

# 2. Configure the API
cp server/.env.example server/.env
#    then set MONGO_URI and JWT_SECRET in server/.env

# 3. Populate the database with demo content
npm run seed:fresh

# 4. Run the API   (terminal 1)
npm run start:server      # http://localhost:5050

# 5. Run the client (terminal 2)
npm run dev:client        # http://localhost:5174
```

Open **http://localhost:5174** and sign in with one of the demo accounts — they
are listed on the login screen and can be used with one click.

> **Ports.** The API defaults to `5050` and the client to `5174` rather than the
> more common `5000`/`5173`, which are frequently already in use. Change `PORT`
> in `server/.env` and `server.port` plus the proxy target in
> `client/vite.config.js` if you prefer different ones.

### Seeding

```bash
npm run seed          # upsert demo data, keep anything already there
npm run seed:fresh    # wipe the collections first, then seed
```

The seeder does not insert pre-computed numbers. It runs the same service
functions the API uses, so enrolments, progress, quiz attempts, completions and
certificates are produced by the real code paths — the seeded state is exactly a
state the app could reach through the UI. Records are then spread back over the
last few weeks so the analytics charts have genuine history.

It creates 11 users, 20 categories, **78 courses**, 211 modules, 546 lessons, 868 resources, 65 quizzes with 133 questions, 127 enrolments, 57 reviews and 28 certificates.

---

## Demo accounts

**Each role has its own password.** All three are shown on the login screen, and
`/login/<role>` shows just that role's credentials with a one-click sign-in.

| Role | Email | Password | What it demonstrates |
|---|---|---|---|
| Student | `kavya.reddy@example.com` | `Student@2026` | 3 enrolments, a completed course, a real certificate, quiz history |
| Instructor | `ananya.verma@lumina.dev` | `Teach@2026` | Published courses, students, per-student progress, course analytics |
| Admin | `admin@lumina.dev` | `Admin@2026` | Platform analytics, a live approval queue, user and category management |

The login screen reads these from `GET /api/auth/demo-accounts` (optionally
`?role=student`), which returns only accounts the seeder created and the password
that role actually has — so the panel can never advertise a login that does not
work, and a student password cannot be used to reach the instructor or admin
portal. Override the values with `DEMO_STUDENT_PASSWORD`,
`DEMO_INSTRUCTOR_PASSWORD` and `DEMO_ADMIN_PASSWORD` in `server/.env`.

Other seeded logins use their role's password: `rohan.iyer@lumina.dev`,
`meera.nair@lumina.dev`, `arjun.desai@lumina.dev` (instructors);
`ishaan.malhotra@example.com`, `sara.khan@example.com`, `dev.patel@example.com`,
`nikita.joshi@example.com`, `aditya.rao@example.com` (students).

---|---|---|
| Student | `kavya.reddy@example.com` | 3 enrolments, one completed course, a real certificate, quiz history |
| Instructor | `ananya.verma@lumina.dev` | 3 published courses, 9 students, per-student progress, course analytics |
| Admin | `admin@lumina.dev` | Platform analytics, a live approval queue, user and category management |

The login screen reads these from `GET /api/auth/demo-accounts`, which returns
only accounts the seeder actually created — so the panel can never advertise a
login that does not work.

Other seeded logins (same password): `rohan.iyer@lumina.dev`,
`meera.nair@lumina.dev`, `arjun.desai@lumina.dev` (instructors);
`ishaan.malhotra@example.com`, `sara.khan@example.com`, `dev.patel@example.com`,
`nikita.joshi@example.com`, `aditya.rao@example.com` (students).

---

## What the three roles can do

### Student

- Register, log in, log out, manage a profile and avatar, change password
- Browse the catalogue with search, category / level / price / rating filters and six sort orders
- View course details: curriculum outline, instructor, ratings and reviews
- Enrol (duplicate enrolment is rejected by both a service check and a unique index)
- Learn: modules → lessons → YouTube video, uploaded video, PDF, document, image, text notes and external links
- Mark lessons complete, and un-mark them
- Take lesson quizzes, retake them, and see per-question review with explanations
- Track progress: percentage, completed and remaining lessons, resume point, per-module breakdown
- Reach 100% → course marked complete → certificate issued automatically
- View and print certificates, and share a public verification link
- Write, edit and delete their own review (one per course)
- Receive notifications and mark them read

### Instructor

- A dedicated dashboard with course pipeline, enrolments per course and certificates issued
- Create, edit, delete, submit, publish and unpublish courses
- Build the curriculum: create / edit / delete / reorder modules and lessons
- Attach any of the seven resource types, by URL or by upload
- Author quizzes: questions, multiple-choice options, correct answers, points, explanations, pass mark, time limit, attempt cap
- Mark a quiz as required, which gates lesson completion behind passing it
- Monitor students: enrolment list, live progress, per-student drill-down, quiz attempts
- Per-course analytics: enrolment trend, progress distribution, rating breakdown
- Broadcast an announcement to everyone enrolled

An instructor can only ever read or write their own courses and the data beneath
them. This is enforced server-side on every module, lesson, resource and quiz
endpoint, not just on the course itself.

### Admin

- Platform analytics: users by role, course lifecycle, enrolment and growth trends, category breakdown, top courses and instructors, recent activity
- Approval queue: preview a submitted course, approve and publish, approve only, or reject with written feedback
- Manage every course regardless of owner, feature courses on the landing page, delete with a full cascade
- Manage users: search, filter, change role, suspend / reactivate, delete
- Manage categories: create, edit, deactivate, delete (refused while courses still use them)
- View every enrolment and grant access on paid courses
- View every learning resource and every issued certificate

Demo accounts are protected from modification and deletion so the demo keeps
working, and an admin cannot suspend, demote or delete themselves.

---

## Theming

Dark is the primary theme; a light theme ships alongside it.

The switch is a single `data-theme` attribute on `<html>`. Every surface, text
and accent colour in the app resolves to a CSS custom property through
`tailwind.config.js`, so `bg-ink-900`, `text-slate-400` and `border-ink-700`
keep working unchanged and repaint together — no component knows which theme is
active. Tokens live in [`client/src/styles/theme.css`](client/src/styles/theme.css).

- There is exactly one toggle per screen: the public header, the dashboard top
  bar, and the learning interface. The admin settings page additionally offers
  it as a labelled choice rather than a second control.
- The choice is persisted in `localStorage`, and follows the OS preference until
  the user makes an explicit choice.
- Chart colours are read from the same variables at render time, and **each
  theme's palette was validated separately** against its own card surface —
  three categorical slots clear all-pairs colour-vision separation in both
  themes, which is why no chart uses a fourth series.
- `text-white` means "the strongest text colour on the current surface". Text
  that must stay white because it sits on a violet fill uses `.text-on-accent`.

A contrast sweep across both themes on every major page is part of the UI test
suite; it fails the run if any text drops below a readable ratio against its own
background.

---

## Navigation

Every page in every portal opens with the same back control, from
[`BackButton.jsx`](client/src/components/layout/BackButton.jsx).

It prefers real history, so a course opened from **My Courses** goes back to My
Courses while the same course opened from search goes back to the search
results. When there is no history to pop — a deep link, a refresh, a new tab —
it falls back to that page's logical parent, so the control is never a dead end.
Browser back and forward are untouched.

---

## Role portals

The homepage header carries **Student · Instructor · Admin** alongside Log in
and Get started. Each opens `/login/<role>`: the same authentication, presented
for that portal, with that role's demo account and a one-click sign-in.

The role in the URL only steers presentation. The real role always comes from
the server's response, so a student who opens `/login/admin` still lands in the
student dashboard — with a plain notice saying so rather than a silent redirect.

**Get started** opens a role picker before registration (`/get-started`), then
continues to `/register?role=…` already configured. Administrator is absent by
design: admin accounts are granted by an existing admin, and the API rejects a
self-assigned admin role no matter what the browser sends.

---

## Profile settings

Every role has a **Profile settings** entry in its sidebar, directly below
Notifications, and every change writes through `PATCH /api/users/me` and
`PATCH /api/auth/password` — endpoints that derive the target user from the
token, so one account can never edit another from here.

**Student and instructor** share
[`pages/shared/Profile.jsx`](client/src/pages/shared/Profile.jsx): a Profile tab
for avatar, name, headline, bio, contact, expertise and social links, and a
Security tab for the password change. Email and role are read-only — an email
change is account recovery, and roles are an administrator's call.

**Administrators** get a dedicated portal,
[`pages/admin/ProfileSettings.jsx`](client/src/pages/admin/ProfileSettings.jsx),
laid out as an account centre:

- **Account standing** — role, status, member since, last sign-in. Read-only.
- **Administrator profile** — the editable fields, with Reset and Save, where
  Save only enables once something actually changed.
- **Account security** — password change with a live strength meter and the
  server's own rules shown as you type.
- **Console preferences** — theme, compact tables and reduced motion. These are
  per-device rather than per-account, so they live in `localStorage` and are
  applied as attributes on `<html>` that CSS keys off; each one changes real
  rendered output rather than only storing a value.

Nothing on these pages exposes a password hash, a token or any secret — the
profile response is checked for that in the security suite.

---

## The learning workflow

This is the full path, and every step is a real database write:

```
Register → Login → Browse → Search / Filter → Course detail → Enrol
   → My Courses → Start learning → Select module → Open lesson
   → Access resources → Mark complete → Take quiz → Receive score
   → Progress updates → Continue → 100% → Course completed
   → Certificate issued → Publicly verifiable
```

A few details worth knowing:

- **Progress is computed, never stored as a claim.** The percentage is derived
  from completed lessons over *publishable* lessons (published lessons inside
  published modules), recalculated on every change. If an instructor adds a
  lesson to a course you had finished, your progress correctly drops below 100%
  and the course reopens.
- **Completion happens in one place.** `progressService.recalculate()` is the
  only code that decides a course is finished, so every path that can advance a
  student — marking a lesson complete, passing a required quiz, an instructor
  deleting a lesson — agrees on the outcome.
- **Certificate issue is idempotent.** It is safe to call repeatedly, handles a
  concurrent-completion race through the unique index, and there is a
  `POST /api/certificates/course/:courseId/claim` safety net if a student is at
  100% without a certificate row.
- **Quizzes are graded on the server.** Correct answers are stripped from the
  payload before a quiz reaches a student who has not submitted. A question
  counts only when the selected set exactly matches the correct set — multi-answer
  questions award no partial credit.

---

## The course approval workflow

```
draft ──submit──► pending ──approve──► approved ──publish──► published
                     │                                  ▲        │
                     └──reject──► rejected ──resubmit────┘        │
                                                                   │
                                          unpublished ◄──unpublish─┘
```

- A course starts as a **draft** and is invisible to students.
- Submitting requires at least one published lesson, a category and a real
  description — the API refuses an empty submission rather than wasting an
  admin's time.
- Only an admin can approve or reject. Approving publishes the course by default
  (`{ "publish": false }` approves without publishing).
- Rejection requires written feedback, which the instructor sees on the course
  page and in a notification.
- Only an **approved** course can be published, so admin approval genuinely gates
  student availability. Illegal transitions are refused by
  `assertStatusTransition`.
- Unpublishing removes a course from the catalogue but keeps enrolled students'
  access and progress intact.

The seed data deliberately includes one pending, one draft and one rejected
course so the workflow has something real to act on the moment you log in.

---

## Free and paid courses

Both are supported, and the difference is honest.

- **Free courses** unlock immediately on enrolment.
- **Paid courses** record a price and can be enrolled in, but **no payment
  gateway is integrated in this build**. Such an enrolment is stored with
  `paymentStatus: 'pending_payment'` and `accessType: 'paid'`, and the content
  stays locked. Nothing anywhere claims a payment occurred.
- An admin can waive it from **Enrolments → Grant access**, which sets
  `paymentStatus: 'waived'` and `accessType: 'granted'` — recorded as an
  administrative grant, not as a payment.
- The admin dashboard reports the list value of pending paid enrolments as
  *potential* revenue, explicitly labelled as such.

The schema and the enrolment service are structured so a real provider can be
dropped in: the payment states already exist, and `enrollmentService.requireAccess`
is the single gate that would need to consult it.

---

## Data model

Fourteen collections, referenced rather than duplicated.

```
User ──< Course (instructor)          Category ──< Course
Course ──< Module ──< Lesson ──< Resource
                        Lesson ──1 Quiz ──< Question
User ──< Enrollment >── Course
Enrollment ──1 Progress
Enrollment ──< QuizAttempt
User ──< Review >── Course            (unique on student+course)
User ──< Certificate >── Course       (unique on student+course)
User ──< Notification
```

| Model | Notes |
|---|---|
| `User` | role (student / instructor / admin), status, profile, bcrypt password with a `passwordChangedAt` guard |
| `Category` | name, slug, icon, colour, active flag |
| `Course` | lifecycle status, pricing, denormalised counters (lessons, modules, duration, enrolments, rating) |
| `Module` | ordered section of a course |
| `Lesson` | video / article body, duration, order, preview and published flags |
| `Resource` | one of youtube, video, pdf, document, image, text, link |
| `Enrollment` | unique per student+course; access and payment state |
| `Progress` | one per enrolment — completed lessons, percentage, resume point, completion |
| `Quiz` | one per lesson — pass mark, time limit, attempt cap, "required to complete" |
| `Question` | single / multiple / boolean, options with correct flags, points, explanation |
| `QuizAttempt` | immutable graded submission; retakes create new attempts |
| `Review` | one per student per course, 1–5 stars, edit-tracked |
| `Certificate` | public id + verification code, snapshotted names so history is stable |
| `Notification` | per-user, typed, with a deep link |

Uniqueness that matters is enforced by the database, not only by application
code: `{student, course}` is unique on `Enrollment`, `Review`, `Certificate` and
`Progress`, and `{lesson}` is unique on `Quiz`.

---

## API reference

Base URL `/api`. Every response uses the same envelope:

```jsonc
// success
{ "success": true, "message": "…", "data": {…}, "meta": {…} }

// failure
{ "success": false, "message": "…", "errors": { "field": "why" } }
```

<details>
<summary><b>Authentication</b> — <code>/api/auth</code></summary>

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/register` | public | Create a student or instructor account |
| POST | `/login` | public | Sign in, returns access + refresh tokens |
| POST | `/refresh` | public | Exchange a refresh token for a new access token |
| POST | `/logout` | public | Clear the auth cookie |
| GET | `/me` | auth | Current user |
| PATCH | `/password` | auth | Change password (invalidates other sessions) |
| GET | `/demo-accounts` | public | Demo credentials (optional `?role=`), shown on the login page |
</details>

<details>
<summary><b>Users</b> — <code>/api/users</code></summary>

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/me` | auth | Own profile |
| PATCH | `/me` | auth | Update own profile |
| POST | `/me/avatar` | auth | Upload an avatar |
| GET | `/me/stats` | auth | Role-appropriate dashboard counters |
| GET | `/instructors/:id` | public | Public instructor profile and courses |
| GET | `/` | admin | List users (search, role and status filters, paginated) |
| GET | `/:id` | admin | User detail with courses or enrolments |
| PATCH | `/:id` | admin | Change role or status |
| DELETE | `/:id` | admin | Delete a user |
</details>

<details>
<summary><b>Courses</b> — <code>/api/courses</code></summary>

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/` | public | Catalogue: search, filter, sort, paginate |
| GET | `/featured` | public | Featured rail |
| GET | `/stats` | public | Landing-page counters |
| GET | `/:idOrSlug` | public | Course detail with curriculum |
| POST | `/` | instructor | Create a draft |
| PATCH | `/:id` | owner/admin | Update |
| DELETE | `/:id` | owner/admin | Delete with full cascade |
| POST | `/:id/thumbnail` | owner/admin | Upload a thumbnail |
| POST | `/:id/submit` | owner/admin | Submit for approval |
| POST | `/:id/publish` | owner/admin | Publish an approved course |
| POST | `/:id/unpublish` | owner/admin | Remove from the catalogue |
| POST | `/:id/announce` | owner/admin | Notify enrolled students |
| GET | `/:id/students` | owner/admin | Enrolled students with progress |
| GET | `/:id/analytics` | owner/admin | Trend, progress bands, ratings |
| POST | `/:id/resync` | owner/admin | Recompute denormalised counters |
| GET | `/instructor/mine` | instructor | Own courses |
| GET | `/admin/all` | admin | Every course, any status |
| POST | `/:id/approve` | admin | Approve (and publish by default) |
| POST | `/:id/reject` | admin | Reject with a reason |
| PATCH | `/:id/feature` | admin | Toggle featured |
</details>

<details>
<summary><b>Categories, modules, lessons, resources</b></summary>

**Categories** `/api/categories` — `GET /`, `GET /:idOrSlug` public;
`POST /`, `PATCH /:id`, `DELETE /:id` admin.

**Modules** — `GET|POST /api/courses/:courseId/modules`,
`PATCH /api/courses/:courseId/modules/reorder`,
`GET|PATCH|DELETE /api/modules/:id`.

**Lessons** — `GET|POST /api/modules/:moduleId/lessons`,
`PATCH /api/modules/:moduleId/lessons/reorder`,
`GET|PATCH|DELETE /api/lessons/:id`.

**Resources** — `GET|POST /api/lessons/:lessonId/resources`,
`POST /api/lessons/:lessonId/resources/upload`,
`GET|PATCH|DELETE /api/resources/:id`, `GET /api/resources/admin/all`.
</details>

<details>
<summary><b>Quizzes</b> — <code>/api/quizzes</code></summary>

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/api/lessons/:lessonId/quiz` | owner/admin | Create the lesson's quiz |
| GET | `/api/lessons/:lessonId/quiz` | auth | Quiz for that lesson |
| GET | `/:id` | auth | Author view, or sanitised attempt view |
| PATCH | `/:id` | owner/admin | Update settings |
| DELETE | `/:id` | owner/admin | Delete with questions and attempts |
| POST | `/:id/questions` | owner/admin | Add a question |
| PATCH | `/api/questions/:id` | owner/admin | Update a question |
| DELETE | `/api/questions/:id` | owner/admin | Delete a question |
| POST | `/:id/submit` | student | Submit and grade |
| GET | `/:id/attempts` | auth | Own attempt history |
| GET | `/attempts/:attemptId` | owner of attempt / instructor / admin | Full review |
| GET | `/:id/results` | owner/admin | Everyone's best scores |
| GET | `/me/results` | auth | All of the student's results |
</details>

<details>
<summary><b>Enrolments, progress, reviews, certificates, notifications</b></summary>

**Enrolments** `/api/enrollments` — `POST /` (student),
`GET /me`, `GET /me/course/:courseId`, `DELETE /:id`;
`GET /` and `PATCH /:id/access` admin.

**Progress** `/api/progress` — `GET /me`, `GET /course/:courseId`,
`POST|DELETE /lessons/:lessonId/complete`,
`PATCH /lessons/:lessonId/position`,
`GET /students/:studentId/course/:courseId` (instructor/admin).

**Reviews** — `GET|POST /api/courses/:courseId/reviews`,
`GET /api/courses/:courseId/reviews/summary`,
`GET /api/reviews/me`, `GET /api/reviews/me/course/:courseId`,
`PATCH|DELETE /api/reviews/:id`.

**Certificates** `/api/certificates` — `GET /verify/:code` **public**,
`GET /me`, `GET /:id`, `POST /course/:courseId/claim`,
`GET /instructor/issued`, `GET /` (admin).

**Notifications** `/api/notifications` — `GET /`, `GET /unread-count`,
`PATCH /:id/read`, `PATCH /read-all`, `DELETE /:id`, `DELETE /read`.

**Admin** `/api/admin` — `GET /stats`, `GET /pending-courses`, `GET /activity`.
</details>

### Status codes

`200` OK · `201` Created · `400` bad request or illegal state transition ·
`401` not authenticated · `403` authenticated but not permitted ·
`404` not found · `409` duplicate · `422` validation failed (with a field map) ·
`429` rate limited · `500` server error.

---

## Security

- **Passwords** are hashed with bcrypt (configurable cost) and the field is
  `select: false`, so it never leaves the data layer unless explicitly asked for.
- **JWT** access tokens are short-lived with a separate refresh token and secret.
  `protect` re-reads the user on every request, so a token issued before a ban,
  a role change or a password change stops working immediately.
- **Authorization is server-side.** Frontend route guards are a convenience only.
  Every protected endpoint independently checks role and ownership; an
  unauthorized API call returns `403` regardless of what the UI allows.
- **Validation** runs at the edge with `express-validator` on registration,
  login, passwords, profiles, courses, categories, modules, lessons, resources,
  quizzes, questions, reviews, ratings and enrolments. Failures return `422`
  with a field → message map the UI renders inline.
- **Login does not leak which emails exist** — wrong password and unknown
  account return the same message.
- **Admin is never self-assignable** at registration.
- **Injection**: `express-mongo-sanitize` strips `$` and `.` from request
  payloads so a crafted body cannot smuggle query operators into a filter.
- **Rate limiting** on the API generally and harder on auth routes.
- **Uploads** are mime-filtered against an allow-list, size-capped, and stored
  under a generated filename — the client's filename is never trusted.
- **Errors** are normalised in one place; stack traces and internal messages are
  never returned in production.
- **Secrets** come from environment variables. `.env` is gitignored and
  `.env.example` documents every key.

---

## Project structure

```
.
├── render.yaml                 Render blueprint for the API
├── package.json                convenience scripts for both workspaces
│
├── server/
│   ├── .env.example
│   └── src/
│       ├── server.js           boot, graceful shutdown
│       ├── app.js              express app, middleware, CORS, routes
│       ├── config/             env validation, db connection, constants
│       ├── models/             14 Mongoose models
│       ├── routes/             15 routers, URL → handler only
│       ├── controllers/        HTTP in, HTTP out
│       ├── services/           business logic shared across controllers
│       │   ├── progressService.js      completion is decided here
│       │   ├── certificateService.js   idempotent issue
│       │   ├── enrollmentService.js    the single access gate
│       │   ├── quizService.js          grading
│       │   ├── courseService.js        ownership, cascade, transitions
│       │   └── notificationService.js  domain events
│       ├── middleware/         auth, authorize, validate, upload, errors
│       ├── validators/         express-validator rule sets
│       ├── utils/              ApiError, response envelope, tokens, slugs
│       └── seed/               demo data, the wider catalogue, seeding scripts
│
└── client/
    ├── vercel.json             SPA rewrites for Vercel
    └── src/
        ├── api/                axios instance + every endpoint
        ├── styles/theme.css    dark and light theme tokens
        ├── context/            AuthContext, ThemeContext
        ├── components/
        │   ├── ui/             design-system primitives
        │   ├── layout/         shells, route guards, BackButton, ThemeToggle
        │   ├── public/         HeroShowcase — the animated homepage visual
        │   ├── course/         card, filters, curriculum, reviews
        │   ├── learn/          resource list, quiz runner
        │   └── charts/         validated chart palette and components
        ├── pages/              public, auth, student, instructor, admin, shared
        └── utils/              formatting, role metadata, console preferences
```

Business logic lives in `services/`, not in route files. Route files are a table
of contents.

---

## Environment variables

### `server/.env`

| Key | Required | Default | Notes |
|---|---|---|---|
| `NODE_ENV` | no | `development` | |
| `PORT` | no | `5050` | Render supplies this in production |
| `MONGO_URI` | **yes** | — | Atlas SRV string, or `mongodb://127.0.0.1:27017`. `MONGODB_URI` is accepted as an alias. |
| `MONGO_DB_NAME` | no | `lms` | The database this app owns. Passed as `dbName`, so it overrides any database path on the URI. |
| `JWT_SECRET` | **yes** | — | 32+ random characters |
| `JWT_EXPIRES_IN` | no | `7d` | |
| `JWT_REFRESH_SECRET` | no | derived | Set it explicitly in production |
| `JWT_REFRESH_EXPIRES_IN` | no | `30d` | |
| `BCRYPT_SALT_ROUNDS` | no | `10` | |
| `CLIENT_URL` | no | `http://localhost:5174` | |
| `CORS_ORIGINS` | no | `CLIENT_URL` | Comma-separated allow-list |
| `UPLOAD_DIR` | no | `uploads` | |
| `MAX_UPLOAD_MB` | no | `50` | |
| `DEMO_STUDENT_PASSWORD` | no | `Student@2026` | Student demo password |
| `DEMO_INSTRUCTOR_PASSWORD` | no | `Teach@2026` | Instructor demo password |
| `DEMO_ADMIN_PASSWORD` | no | `Admin@2026` | Admin demo password |

The server refuses to boot if `MONGO_URI` or `JWT_SECRET` is missing — a
half-configured auth layer is worse than no boot.

### `client/.env`

| Key | Notes |
|---|---|
| `VITE_API_URL` | Leave **empty** in development so Vite's proxy handles `/api`. Set to the Render URL in production. |
| `VITE_APP_NAME` | Display name, defaults to `Lumina`. |

---

## Deployment

### Database — MongoDB Atlas

1. Create (or open) your cluster and a database user.
2. Network Access → allow your IP and Render's egress IPs, or `0.0.0.0/0` for a demo.
3. Copy the SRV connection string and URL-encode the password (`@` → `%40`).
4. Set it as `MONGO_URI`. Leave `MONGO_DB_NAME` as `lms`.
5. Seed it once: `MONGO_URI="<atlas-uri>" npm run seed:fresh`.

**On a cluster shared with other projects**, this app is confined to one
database by construction:

- `MONGO_DB_NAME` (default `lms`) is passed to Mongoose as `dbName`, which
  **overrides any database path on the connection string**. A URI copied from
  Atlas without a path cannot silently land in `test`.
- The connection is **verified, not assumed** — if the live database is not the
  one configured, the app closes the connection and refuses to start.
- Nothing in the codebase calls `listDatabases()`, `dropDatabase()` or any
  admin command. Every destructive operation is a Mongoose model
  `deleteMany()`, which is scoped to one collection in one database.
- The seeder's full reset additionally refuses to run unless the live database
  is `lms` (or an `lms_*` variant), **whatever the environment says** — so a
  typo in `MONGO_DB_NAME` cannot turn a reseed into another project's outage.
- No log line contains the connection string, the credentials or the JWT
  secret. Startup prints the host and the database name only.

**Migrating existing local data to Atlas:**

```bash
# Dry run: compares both ends and reports conflicts. Writes nothing.
MIGRATE_TO="mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net" npm run migrate:atlas

# Copy across once you are happy with the plan.
MIGRATE_TO="..." npm run migrate:atlas:apply
```

It copies only the 14 LMS collections and preserves `_id` values, so every
ObjectId reference between users, courses, modules, lessons, enrolments,
quizzes and certificates survives the move. Add `--replace` to clear the
destination's LMS collections first; without it, collections that already hold
data are skipped.

### Backend — Render

Either use the included blueprint (**New → Blueprint**, point at the repo, fill
in the prompted secrets), or configure a Web Service manually:

| Setting | Value |
|---|---|
| Root directory | `server` |
| Build command | `npm ci --omit=dev` |
| Start command | `npm start` |
| Health check path | `/health` |

Set `MONGO_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CLIENT_URL` and
`CORS_ORIGINS` in the Render dashboard.

> On Render's free plan the filesystem is ephemeral, so uploaded files are lost
> on redeploy. Attach a disk, or move uploads to object storage, before relying
> on them. URL-based resources (YouTube, external links) are unaffected.

### Frontend — Vercel

| Setting | Value |
|---|---|
| Root directory | `client` |
| Framework | Vite |
| Build command | `npm run build` |
| Output directory | `dist` |

Set `VITE_API_URL` to your Render URL (no trailing slash). `vercel.json` already
rewrites all routes to `index.html` so client-side routing works on refresh.

The API's CORS rule accepts any `*.vercel.app` origin in addition to the
configured allow-list, so preview deployments work without extra configuration.

---

## Testing

Four suites drive the running application through its real interfaces — no
mocks, no direct database access.

```bash
npm run test:all          # everything below

npm run test:api          # the three API suites
npm run test:workflow     #  55 assertions — the student learning path
npm run test:authoring    #  88 assertions — instructor authoring + admin moderation
npm run test:security     #  53 assertions — role-based authorisation
npm run test:ui           #  42 assertions — navigation, theme, role portals and profile settings
```

They target `http://localhost:5050` and `http://localhost:5174` by default; set
`API_URL` / `APP_URL` to point elsewhere, and `CHROME_PATH` if Chrome is not in
the default location. Re-seed afterwards (`npm run seed:fresh`) — the authoring
suite creates, approves and deletes real records.

**Workflow** registers a brand-new student and walks the documented path:
register → login → browse → search → filter → detail → enrol → learn → complete
lessons → take a quiz → reach 100% → certificate issued → publicly verified →
review created, edited and deleted → notifications produced. It also checks that
weak passwords are rejected, admin is not self-assignable, duplicate enrolment
returns 409, non-preview content is blocked before enrolment, quizzes never leak
correct answers to students, and one student cannot touch another's review.

**Authoring** builds a course from nothing through the API: modules, lessons, all
seven resource types, a quiz with single- and multi-answer questions, reordering,
submission, admin approval, publication, student enrolment, announcements,
unpublish / republish, the rejection branch, category and user management,
suspension, and the delete cascade.

**Security** confirms the backend refuses cross-role access on its own, and
that a profile edit really reaches the database and is scoped to the caller: every
admin endpoint rejects a student and an instructor token, one instructor cannot
touch another's course, the three demo passwords are not interchangeable, every
advertised credential works, unauthenticated and malformed tokens are refused,
and a user cannot promote themselves to admin at registration or through the
profile endpoint.

**UI** drives headless Chrome against the real app: the three header role
portals, Get started → role selection → registration, the theme toggle and its
persistence across reload and route change, back navigation from course details
returning to the correct parent, a back control on all 24 portal pages, the
Profile settings entry sitting directly below Notifications for each role with a
working password form behind it, exactly one theme toggle per dashboard, and URL
tampering (a student typing `/admin` is redirected, a signed-out visitor is sent
to login). It also sweeps both themes for low-contrast text.

---

## Notes and known limits

- **No payment gateway.** Paid enrolment is recorded as pending and content stays
  locked, as described above. This is deliberate rather than a gap in the UI.
- **Uploads are on local disk.** Fine for development and for a Render instance
  with a disk attached; use object storage for real production.
- **Notifications are polled**, not pushed. The bell refreshes on open and on a
  60-second interval. A websocket layer would be the next step.
- **Certificates print via the browser** using a print stylesheet rather than a
  server-side PDF library, so what you see is exactly what prints.
