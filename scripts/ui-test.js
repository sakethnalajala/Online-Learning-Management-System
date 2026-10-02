/**
 * Drives the real UI to check back navigation, the theme toggle and the role
 * portals actually behave — the things a render check cannot tell you.
 */
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Override with CHROME_PATH if Chrome lives elsewhere on your machine.
const CHROME =
  process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const APP = process.env.APP_URL || 'http://localhost:5174';
const API = process.env.API_URL || 'http://localhost:5050';
const PORT = 9338;

const PASSWORDS = { student: 'Student@2026', instructor: 'Teach@2026', admin: 'Admin@2026' };
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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const getJson = (url) =>
  new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject);
  });

const login = async (role) => {
  const res = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: LOGINS[role], password: PASSWORDS[role] }),
  });
  return (await res.json()).data;
};

(async () => {
  const profile = path.join(os.tmpdir(), `lumina-nav-${Date.now()}`);
  fs.mkdirSync(profile, { recursive: true });

  const chrome = spawn(
    CHROME,
    [
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${profile}`,
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--window-size=1440,1000',
      'about:blank',
    ],
    { stdio: 'ignore' }
  );
  process.on('exit', () => {
    try {
      chrome.kill();
    } catch {}
  });

  let target = null;
  for (let i = 0; i < 40; i += 1) {
    try {
      const list = await getJson(`http://127.0.0.1:${PORT}/json/list`);
      target = list.find((t) => t.type === 'page');
      if (target) break;
    } catch {}
    await sleep(250);
  }

  // Node 22+ ships a global WebSocket, so this needs no dependency. Older
  // runtimes fall back to the `ws` package if it happens to be installed.
  const WS =
    typeof WebSocket !== 'undefined'
      ? WebSocket
      : await import('ws').then((m) => m.default);
  const ws = new WS(target.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  const onMessage = (event) => {
    const raw = event?.data ?? event;
    const msg = JSON.parse(typeof raw === 'string' ? raw : raw.toString());
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
    }
  };
  if (ws.on) ws.on('message', onMessage);
  else ws.addEventListener('message', onMessage);
  await new Promise((res, rej) => {
    if (ws.once) {
      ws.once('open', res);
      ws.once('error', rej);
    } else {
      ws.addEventListener('open', res, { once: true });
      ws.addEventListener('error', rej, { once: true });
    }
  });
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      id += 1;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });

  const evalJs = async (expression, awaitPromise = false) => {
    const res = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise,
    });
    return res.result?.value;
  };

  const go = async (route, wait = 2200) => {
    await send('Page.navigate', { url: `${APP}${route}` });
    await sleep(wait);
  };

  const url = () => evalJs('location.pathname + location.search');

  /** Clicks the first element whose visible text matches. */
  const clickText = async (text, wait = 1800) => {
    const clicked = await evalJs(`(() => {
      const wanted = ${JSON.stringify(text)}.toLowerCase();
      const nodes = [...document.querySelectorAll('a, button')];
      const hit = nodes.find((n) => (n.innerText || '').trim().toLowerCase().startsWith(wanted));
      if (!hit) return false;
      hit.click();
      return true;
    })()`);
    await sleep(wait);
    return clicked;
  };

  const setAuth = async (tokens) => {
    await go('/', 1200);
    await evalJs(
      tokens
        ? `localStorage.setItem('lumina.accessToken', ${JSON.stringify(tokens.accessToken)});
           localStorage.setItem('lumina.refreshToken', ${JSON.stringify(tokens.refreshToken)});`
        : `localStorage.removeItem('lumina.accessToken');localStorage.removeItem('lumina.refreshToken');`
    );
  };

  console.log('\n=== NAVIGATION, THEME AND ROLE PORTALS ===\n');

  /* ── Homepage role portals ───────────────────────────────────────────── */
  console.log('[homepage role portals]');
  await setAuth(null);
  await go('/');

  for (const role of ['Student', 'Instructor', 'Admin']) {
    await go('/');
    const clicked = await clickText(role);
    const at = await url();
    check(`"${role}" in the header opens its login`, clicked && at === `/login/${role.toLowerCase()}`, at);
  }

  await go('/');
  const gsClicked = await clickText('Get started');
  const gsAt = await url();
  check('"Get started" opens role selection', gsClicked && gsAt === '/get-started', gsAt);

  const contClicked = await clickText('Continue as student');
  const contAt = await url();
  check('role selection continues to registration', contClicked && contAt.startsWith('/register'), contAt);

  /* ── Theme toggle and persistence ────────────────────────────────────── */
  console.log('\n[theme]');
  await go('/');
  const initialTheme = await evalJs("document.documentElement.getAttribute('data-theme')");
  check('a theme is applied on load', initialTheme === 'dark' || initialTheme === 'light', initialTheme);

  // Click the option that is not currently active.
  const wanted = initialTheme === 'dark' ? 'light' : 'dark';
  await evalJs(`document.querySelector('[role="radio"][aria-label="${wanted === 'light' ? 'Light' : 'Dark'} theme"]').click()`);
  await sleep(600);
  const switched = await evalJs("document.documentElement.getAttribute('data-theme')");
  check('toggle switches the theme', switched === wanted, switched);

  const stored = await evalJs("localStorage.getItem('lumina.theme')");
  check('choice is persisted', stored === wanted, stored);

  await send('Page.reload');
  await sleep(2200);
  const afterReload = await evalJs("document.documentElement.getAttribute('data-theme')");
  check('theme survives a reload', afterReload === wanted, afterReload);

  // Confirm it carries across a route change into a dashboard.
  const student = await login('student');
  await setAuth(student);
  await go('/student');
  const inDashboard = await evalJs("document.documentElement.getAttribute('data-theme')");
  check('theme applies inside the dashboard', inDashboard === wanted, inDashboard);

  // Back to dark for the remaining checks.
  await evalJs(`localStorage.setItem('lumina.theme','dark');document.documentElement.setAttribute('data-theme','dark');`);

  /* ── Back navigation: the original complaint ─────────────────────────── */
  console.log('\n[back navigation]');

  // Student: My Courses -> Course Details -> Back should return to My Courses.
  await go('/student/courses', 2600);
  const courseLink = await evalJs(`(() => {
    const link = [...document.querySelectorAll('a[href^="/courses/"]')][0];
    if (!link) return null;
    link.click();
    return link.getAttribute('href');
  })()`);
  await sleep(2600);
  const onDetail = await url();
  check('opened a course from My Courses', Boolean(courseLink) && onDetail.startsWith('/courses/'), onDetail);

  const backClicked = await clickText('Back', 2200);
  const afterBack = await url();
  check(
    'Back from course details returns to My Courses',
    backClicked && afterBack === '/student/courses',
    afterBack
  );

  // Deep link with no history: Back must still go somewhere sensible.
  const courses = await getJson(`${API}/api/courses?limit=1`);
  await go(`/courses/${courses.data[0].slug}`, 2600);
  const deepBack = await clickText('Back', 2200);
  const afterDeepBack = await url();
  check(
    'Back on a deep-linked course falls back to the catalogue',
    deepBack && afterDeepBack === '/courses',
    afterDeepBack
  );

  // Every portal page exposes a back control.
  const pages = {
    student: [
      '/student',
      '/student/courses',
      '/student/quizzes',
      '/student/certificates',
      '/student/reviews',
      '/student/notifications',
      '/student/profile',
    ],
    instructor: [
      '/instructor',
      '/instructor/courses',
      '/instructor/students',
      '/instructor/certificates',
      '/instructor/notifications',
      '/instructor/profile',
    ],
    admin: [
      '/admin',
      '/admin/courses',
      '/admin/approvals',
      '/admin/users',
      '/admin/categories',
      '/admin/enrollments',
      '/admin/resources',
      '/admin/certificates',
      '/admin/notifications',
      '/admin/profile',
    ],
  };

  for (const [role, routes] of Object.entries(pages)) {
    const tokens = await login(role);
    await setAuth(tokens);
    let withBack = 0;
    for (const route of routes) {
      await go(route, 2000);
      const has = await evalJs(`(() => {
        const nodes = [...document.querySelectorAll('button, a')];
        return nodes.some((n) => /^back\\b/i.test((n.innerText || '').trim()));
      })()`);
      if (has) withBack += 1;
      else console.log(`        (no back control on ${route})`);
    }
    check(`every ${role} page has a back control`, withBack === routes.length, `${withBack}/${routes.length}`);
  }

  /* ── Profile Settings portal, per role ───────────────────────────────── */
  console.log('\n[profile settings]');

  for (const role of ['student', 'instructor', 'admin']) {
    const tokens = await login(role);
    await setAuth(tokens);
    await go(`/${role}`, 2400);

    // The sidebar entry exists and sits directly below Notifications.
    const order = await evalJs(`(() => {
      const links = [...document.querySelectorAll('nav a')]
        .map((a) => (a.innerText || '').trim().toLowerCase())
        .filter(Boolean);
      const n = links.findIndex((t) => t.startsWith('notifications'));
      const p = links.findIndex((t) => t.startsWith('profile settings'));
      return JSON.stringify({ n, p });
    })()`);
    const { n, p } = JSON.parse(order);
    check(`${role} sidebar has Profile settings`, p !== -1, `index ${p}`);
    check(`${role} Profile settings sits below Notifications`, n !== -1 && p === n + 1, `${n} -> ${p}`);

    const clicked = await clickText('Profile settings', 2600);
    const at = await url();
    check(`${role} can open Profile settings`, clicked && at === `/${role}/profile`, at);

    // `\\b` not `\b`: inside a template literal a single backslash-b is the
    // backspace character, so the word boundary has to be escaped.
    const hasBack = await evalJs(`(() => [...document.querySelectorAll('button, a')]
      .some((el) => /^back\\b/i.test((el.innerText || '').trim())))()`);
    check(`${role} Profile settings has a back control`, hasBack);

    // Student and instructor keep the password form behind a Security tab;
    // the admin portal lays every section out on one page.
    const openedSecurity = await clickText('Security', 1200);
    const hasPassword = await evalJs(`(() => {
      const text = document.body.innerText.toLowerCase();
      return text.includes('current password') && text.includes('new password');
    })()`);
    check(
      `${role} Profile settings offers a password change`,
      hasPassword,
      openedSecurity ? 'via the Security tab' : 'on the page'
    );
  }

  // The admin portal is the richer one.
  const adminTokens = await login('admin');
  await setAuth(adminTokens);
  await go('/admin/profile', 2800);
  const adminSections = await evalJs(`(() => {
    const text = document.body.innerText.toLowerCase();
    return JSON.stringify({
      standing: text.includes('account standing'),
      security: text.includes('account security'),
      prefs: text.includes('console preferences'),
      strength: text.includes('password strength'),
    });
  })()`);
  const sections = JSON.parse(adminSections);
  check('admin settings shows account standing', sections.standing);
  check('admin settings shows account security', sections.security);
  check('admin settings shows console preferences', sections.prefs);
  check('admin settings shows a password strength meter', sections.strength);

  /* ── One global theme control ────────────────────────────────────────── */
  console.log('\n[single theme control]');
  for (const role of ['student', 'instructor', 'admin']) {
    const tokens = await login(role);
    await setAuth(tokens);
    await go(`/${role}`, 2400);
    const count = await evalJs(
      `document.querySelectorAll('[role="radiogroup"][aria-label="Colour theme"]').length`
    );
    check(`${role} dashboard has exactly one theme toggle`, count === 1, `${count} found`);
  }

  /* ── URL tampering is refused ────────────────────────────────────────── */
  console.log('\n[route protection]');
  const studentTokens = await login('student');
  await setAuth(studentTokens);

  await go('/admin', 2600);
  const adminAttempt = await url();
  check('student typing /admin is redirected away', adminAttempt !== '/admin', adminAttempt);

  await go('/instructor', 2600);
  const instructorAttempt = await url();
  check('student typing /instructor is redirected away', instructorAttempt !== '/instructor', instructorAttempt);

  const instructorTokens = await login('instructor');
  await setAuth(instructorTokens);
  await go('/admin', 2600);
  const instrToAdmin = await url();
  check('instructor typing /admin is redirected away', instrToAdmin !== '/admin', instrToAdmin);

  await setAuth(null);
  await go('/student', 2600);
  const guestAttempt = await url();
  check('signed-out visitor is sent to login', guestAttempt === '/login', guestAttempt);

  console.log(`\n=== ${pass} passed, ${fail} failed ===\n`);
  ws.close();
  chrome.kill();
  process.exit(fail > 0 ? 1 : 0);
})().catch((e) => {
  console.error('HARNESS ERROR:', e);
  process.exit(1);
});
