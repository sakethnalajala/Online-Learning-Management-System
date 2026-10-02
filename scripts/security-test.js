/**
 * Role-based authorisation checks.
 *
 * Confirms the backend refuses cross-role access on its own, regardless of what
 * the frontend allows — the case that matters when someone edits the URL or
 * calls the API directly with a valid token for a different role.
 */
const API = process.env.API_URL || 'http://localhost:5050';

const PASSWORDS = {
  student: 'Student@2026',
  instructor: 'Teach@2026',
  admin: 'Admin@2026',
};

const LOGINS = {
  student: 'kavya.reddy@example.com',
  instructor: 'ananya.verma@lumina.dev',
  admin: 'admin@lumina.dev',
};

let pass = 0;
let fail = 0;
const check = (label, ok, extra = '') => {
  if (ok) {
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

const tokenFor = async (role) => {
  const res = await api('POST', '/api/auth/login', {
    body: { email: LOGINS[role], password: PASSWORDS[role] },
  });
  if (!res.body?.data?.accessToken) throw new Error(`login failed for ${role}`);
  return res.body.data.accessToken;
};

(async () => {
  console.log('\n=== ROLE-BASED SECURITY ===\n');

  const student = await tokenFor('student');
  const instructor = await tokenFor('instructor');
  const admin = await tokenFor('admin');

  /* ── Demo passwords are distinct and not interchangeable ─────────────── */
  console.log('[demo credentials]');
  const unique = new Set(Object.values(PASSWORDS));
  check('all three demo passwords differ', unique.size === 3);

  for (const role of ['student', 'instructor', 'admin']) {
    for (const other of ['student', 'instructor', 'admin']) {
      if (role === other) continue;
      const res = await api('POST', '/api/auth/login', {
        body: { email: LOGINS[role], password: PASSWORDS[other] },
      });
      check(
        `${role} email + ${other} password rejected`,
        res.status === 401,
        `status ${res.status}`
      );
    }
  }

  const advertised = await api('GET', '/api/auth/demo-accounts');
  check('demo endpoint lists three accounts', advertised.body.data.length === 3);
  for (const account of advertised.body.data) {
    const res = await api('POST', '/api/auth/login', {
      body: { email: account.email, password: account.password },
    });
    check(`advertised ${account.role} credentials actually work`, res.status === 200);
  }

  /* ── Student cannot reach instructor or admin functionality ──────────── */
  console.log('\n[student boundaries]');
  const studentBlocked = [
    ['GET', '/api/admin/stats'],
    ['GET', '/api/admin/pending-courses'],
    ['GET', '/api/admin/activity'],
    ['GET', '/api/users'],
    ['GET', '/api/enrollments'],
    ['GET', '/api/certificates'],
    ['GET', '/api/resources/admin/all'],
    ['GET', '/api/courses/admin/all'],
    ['GET', '/api/courses/instructor/mine'],
    ['GET', '/api/certificates/instructor/issued'],
  ];
  for (const [method, path] of studentBlocked) {
    const res = await api(method, path, { token: student });
    check(`student blocked from ${path}`, res.status === 403, `status ${res.status}`);
  }

  const studentCreate = await api('POST', '/api/courses', {
    token: student,
    body: { title: 'Should not exist', description: 'x'.repeat(40), category: '000000000000000000000000' },
  });
  check('student cannot create a course', studentCreate.status === 403);

  const studentCategory = await api('POST', '/api/categories', {
    token: student,
    body: { name: 'Student made this' },
  });
  check('student cannot create a category', studentCategory.status === 403);

  /* ── Instructor cannot reach admin functionality ─────────────────────── */
  console.log('\n[instructor boundaries]');
  const instructorBlocked = [
    ['GET', '/api/admin/stats'],
    ['GET', '/api/admin/pending-courses'],
    ['GET', '/api/users'],
    ['GET', '/api/enrollments'],
    ['GET', '/api/certificates'],
    ['GET', '/api/resources/admin/all'],
    ['GET', '/api/courses/admin/all'],
  ];
  for (const [method, path] of instructorBlocked) {
    const res = await api(method, path, { token: instructor });
    check(`instructor blocked from ${path}`, res.status === 403, `status ${res.status}`);
  }

  const instructorCategory = await api('POST', '/api/categories', {
    token: instructor,
    body: { name: 'Instructor made this' },
  });
  check('instructor cannot create a category', instructorCategory.status === 403);

  // Another instructor's course is off limits.
  const otherInstructor = await api('POST', '/api/auth/login', {
    body: { email: 'rohan.iyer@lumina.dev', password: PASSWORDS.instructor },
  });
  const otherToken = otherInstructor.body.data.accessToken;

  const mine = await api('GET', '/api/courses/instructor/mine?limit=1', { token: instructor });
  const ownedId = mine.body.data[0]?._id;

  if (ownedId) {
    const steal = await api('PATCH', `/api/courses/${ownedId}`, {
      token: otherToken,
      body: { title: 'Hijacked by another instructor' },
    });
    check("instructor cannot edit another instructor's course", steal.status === 403);

    const stealStudents = await api('GET', `/api/courses/${ownedId}/students`, { token: otherToken });
    check("instructor cannot read another instructor's students", stealStudents.status === 403);

    const stealAnalytics = await api('GET', `/api/courses/${ownedId}/analytics`, { token: otherToken });
    check("instructor cannot read another instructor's analytics", stealAnalytics.status === 403);

    const stealDelete = await api('DELETE', `/api/courses/${ownedId}`, { token: otherToken });
    check("instructor cannot delete another instructor's course", stealDelete.status === 403);

    const approveOwn = await api('POST', `/api/courses/${ownedId}/approve`, { token: instructor });
    check('instructor cannot approve a course', approveOwn.status === 403);
  }

  /* ── Admin does have platform-wide access ────────────────────────────── */
  console.log('\n[admin access]');
  const adminAllowed = [
    '/api/admin/stats',
    '/api/admin/pending-courses',
    '/api/admin/activity',
    '/api/users',
    '/api/enrollments',
    '/api/certificates',
    '/api/resources/admin/all',
    '/api/courses/admin/all',
  ];
  for (const path of adminAllowed) {
    const res = await api('GET', path, { token: admin });
    check(`admin can reach ${path}`, res.status === 200, `status ${res.status}`);
  }

  /* ── Unauthenticated access is refused ───────────────────────────────── */
  console.log('\n[no token]');
  for (const path of ['/api/admin/stats', '/api/users', '/api/enrollments/me', '/api/progress/me']) {
    const res = await api('GET', path);
    check(`unauthenticated request to ${path} rejected`, res.status === 401, `status ${res.status}`);
  }

  const garbage = await api('GET', '/api/auth/me', { token: 'not-a-real-token' });
  check('malformed token rejected', garbage.status === 401);

  /* ── Role cannot be self-assigned at registration ────────────────────── */
  console.log('\n[privilege escalation]');
  const asAdmin = await api('POST', '/api/auth/register', {
    body: {
      name: 'Escalation Test',
      email: `escalate.${Date.now()}@example.com`,
      password: 'Passw0rd!',
      role: 'admin',
    },
  });
  check('cannot register as admin', asAdmin.status === 422, `status ${asAdmin.status}`);

  // Even a successful registration must come back as a student.
  const asStudent = await api('POST', '/api/auth/register', {
    body: {
      name: 'Escalation Test 2',
      email: `escalate2.${Date.now()}@example.com`,
      password: 'Passw0rd!',
    },
  });
  check('new account defaults to student', asStudent.body?.data?.user?.role === 'student');

  const newToken = asStudent.body.data.accessToken;
  const selfPromote = await api('PATCH', '/api/users/me', {
    token: newToken,
    body: { role: 'admin' },
  });
  check('user cannot promote themselves via the profile endpoint', selfPromote.status === 422);

  const stillStudent = await api('GET', '/api/auth/me', { token: newToken });
  check('role unchanged after the attempt', stillStudent.body.data.user.role === 'student');

  // Clean up the throwaway accounts.
  for (const created of [asStudent]) {
    const id = created.body?.data?.user?._id;
    if (id) await api('DELETE', `/api/users/${id}`, { token: admin });
  }

  /* ── Profile settings: real persistence, scoped to the caller ────────── */
  console.log('\n[profile settings]');

  for (const role of ['student', 'instructor', 'admin']) {
    const token = await tokenFor(role);

    const before = await api('GET', '/api/users/me', { token });
    check(`${role} can read their own profile`, before.status === 200);

    const marker = `Headline check ${Date.now()}`;
    const saved = await api('PATCH', '/api/users/me', { token, body: { headline: marker } });
    check(`${role} can update their own profile`, saved.status === 200);

    // Read back on a fresh request: proves it reached the database rather than
    // only the response body.
    const after = await api('GET', '/api/users/me', { token });
    check(`${role} profile change persisted`, after.body?.data?.headline === marker);

    // Restore, so repeated runs do not drift the demo data.
    await api('PATCH', '/api/users/me', {
      token,
      body: { headline: before.body.data.headline || '' },
    });

    // Role and status are not writable from the profile endpoint.
    const escalate = await api('PATCH', '/api/users/me', { token, body: { role: 'admin' } });
    check(`${role} cannot change their role from the profile endpoint`, escalate.status === 422);

    const suspend = await api('PATCH', '/api/users/me', { token, body: { status: 'suspended' } });
    check(`${role} cannot change their status from the profile endpoint`, suspend.status === 422);

    // No password material ever comes back.
    const body = JSON.stringify(after.body || {}).toLowerCase();
    check(
      `${role} profile response leaks no password material`,
      !body.includes('"password"') && !body.includes('passwordchangedat')
    );
  }

  // One user cannot edit another by targeting their id.
  const studentToken = await tokenFor('student');
  const instructorToken = await tokenFor('instructor');
  const roster = await api('GET', '/api/users?role=instructor&limit=1', { token: admin });
  const victimId = roster.body?.data?.[0]?._id;

  if (victimId) {
    const hijack = await api('PATCH', `/api/users/${victimId}`, {
      token: studentToken,
      body: { name: 'Hijacked' },
    });
    check("student cannot edit another user's record", hijack.status === 403, `status ${hijack.status}`);

    const hijack2 = await api('PATCH', `/api/users/${victimId}`, {
      token: instructorToken,
      body: { name: 'Hijacked' },
    });
    check(
      "instructor cannot edit another user's record",
      hijack2.status === 403,
      `status ${hijack2.status}`
    );
  }

  // Password change requires the current password and a strong new one.
  const wrongCurrent = await api('PATCH', '/api/auth/password', {
    token: studentToken,
    body: { currentPassword: 'NotTheRealOne1', newPassword: 'BrandNewPass1' },
  });
  check(
    'password change rejects a wrong current password',
    wrongCurrent.status === 401,
    `status ${wrongCurrent.status}`
  );

  const weakNew = await api('PATCH', '/api/auth/password', {
    token: studentToken,
    body: { currentPassword: PASSWORDS.student, newPassword: 'weak' },
  });
  check('password change rejects a weak new password', weakNew.status === 422, `status ${weakNew.status}`);

  const noToken = await api('PATCH', '/api/auth/password', {
    body: { currentPassword: PASSWORDS.student, newPassword: 'BrandNewPass1' },
  });
  check('password change requires authentication', noToken.status === 401);

  console.log(`\n=== ${pass} passed, ${fail} failed ===\n`);
  process.exit(fail > 0 ? 1 : 0);
})().catch((err) => {
  console.error('HARNESS ERROR:', err);
  process.exit(1);
});
