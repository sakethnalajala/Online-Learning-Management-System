/**
 * Demo content for the seeder. Kept as plain data so the seeding logic in
 * seed.js stays readable and the catalogue is easy to extend.
 *
 * Video URLs point at real, publicly available YouTube lectures so the
 * learning interface has something genuine to play.
 */

const categories = [
  { name: 'Web Development', icon: 'Code2', color: '#8b5cf6', description: 'Frontend, backend and full-stack engineering.' },
  { name: 'Programming', icon: 'Terminal', color: '#a855f7', description: 'Languages, algorithms and the craft of writing code.' },
  { name: 'JavaScript', icon: 'Braces', color: '#eab308', description: 'The language of the web, in depth.' },
  { name: 'React', icon: 'Atom', color: '#06b6d4', description: 'Components, hooks, state and the React ecosystem.' },
  { name: 'Node.js', icon: 'Hexagon', color: '#22c55e', description: 'Server-side JavaScript, APIs and real-time systems.' },
  { name: 'Python', icon: 'FileCode2', color: '#3b82f6', description: 'Scripting, web frameworks and automation.' },
  { name: 'Java', icon: 'Coffee', color: '#f97316', description: 'The JVM, Spring and enterprise development.' },
  { name: 'Data Science', icon: 'ChartSpline', color: '#06b6d4', description: 'Analytics, statistics and data engineering.' },
  { name: 'Machine Learning', icon: 'Binary', color: '#8b5cf6', description: 'Modelling, validation and applied ML.' },
  { name: 'Artificial Intelligence', icon: 'BrainCircuit', color: '#a855f7', description: 'Deep learning, NLP and applied AI.' },
  { name: 'Database', icon: 'Database', color: '#14b8a6', description: 'SQL, NoSQL, modelling and performance.' },
  { name: 'Cloud Computing', icon: 'Cloud', color: '#0ea5e9', description: 'AWS, Azure and cloud architecture.' },
  { name: 'DevOps', icon: 'Workflow', color: '#10b981', description: 'CI/CD, containers, infrastructure and observability.' },
  { name: 'Cybersecurity', icon: 'ShieldCheck', color: '#ef4444', description: 'Application, network and defensive security.' },
  { name: 'UI/UX Design', icon: 'Palette', color: '#ec4899', description: 'Interface design, research and design systems.' },
  { name: 'Mobile Development', icon: 'Smartphone', color: '#6366f1', description: 'iOS, Android and cross-platform apps.' },
  { name: 'Business/Technology', icon: 'Briefcase', color: '#f59e0b', description: 'Product, architecture, delivery and analytics.' },
  { name: 'Design', icon: 'PenTool', color: '#f472b6', description: 'Visual and product design fundamentals.' },
  { name: 'Business', icon: 'TrendingUp', color: '#fbbf24', description: 'Strategy, management and entrepreneurship.' },
  { name: 'Cloud & DevOps', icon: 'Server', color: '#34d399', description: 'Infrastructure, CI/CD and platform engineering.' },
];

const instructors = [
  {
    name: 'Ananya Verma',
    email: 'ananya.verma@lumina.dev',
    headline: 'Senior Full-Stack Engineer · ex-Flipkart',
    bio: 'I have spent eleven years building production React and Node systems, and the last four teaching them. I care about why a pattern exists, not just how to type it.',
    expertise: ['React', 'Node.js', 'MongoDB', 'System Design'],
  },
  {
    name: 'Rohan Iyer',
    email: 'rohan.iyer@lumina.dev',
    headline: 'Data Scientist · PhD Statistics',
    bio: 'I work on forecasting problems at scale and believe most people are taught statistics backwards. My courses start from the question, not the formula.',
    expertise: ['Python', 'Statistics', 'Machine Learning', 'Pandas'],
  },
  {
    name: 'Meera Nair',
    email: 'meera.nair@lumina.dev',
    headline: 'Product Designer · Design Systems Lead',
    bio: 'Fifteen years in product design across fintech and healthcare. I teach the craft of interface design, including the parts that are uncomfortable to hear.',
    expertise: ['UI Design', 'Design Systems', 'Figma', 'Accessibility'],
  },
  {
    name: 'Arjun Desai',
    email: 'arjun.desai@lumina.dev',
    headline: 'Cloud Architect · AWS & Kubernetes',
    bio: 'I help teams stop firefighting their infrastructure. Expect a lot of hard-won opinions about what actually keeps a platform up.',
    expertise: ['AWS', 'Kubernetes', 'Terraform', 'CI/CD'],
  },
];

const students = [
  { name: 'Kavya Reddy', email: 'kavya.reddy@example.com', headline: 'CS undergraduate' },
  { name: 'Ishaan Malhotra', email: 'ishaan.malhotra@example.com', headline: 'Career switcher, ex-mechanical engineer' },
  { name: 'Sara Khan', email: 'sara.khan@example.com', headline: 'Frontend developer, 2 years experience' },
  { name: 'Dev Patel', email: 'dev.patel@example.com', headline: 'Final-year IT student' },
  { name: 'Nikita Joshi', email: 'nikita.joshi@example.com', headline: 'Business analyst learning to code' },
  { name: 'Aditya Rao', email: 'aditya.rao@example.com', headline: 'Self-taught developer' },
];

/**
 * Courses. `instructorEmail` and `categoryName` are resolved to ids by the
 * seeder. `status` drives the approval-workflow demo, so the admin dashboard
 * has a real pending queue and a real rejected course to look at.
 */
const courses = [
  {
    title: 'Modern React from Scratch: Hooks, Router and Real Projects',
    subtitle: 'Build production-grade interfaces with the React model, not against it',
    instructorEmail: 'ananya.verma@lumina.dev',
    categoryName: 'Web Development',
    level: 'beginner',
    isFree: true,
    price: 0,
    status: 'published',
    isFeatured: true,
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80',
    description:
      'React rewards you for understanding its model and punishes you for guessing at it. This course builds that model deliberately: what a component really is, why state lives where it lives, when an effect is the wrong tool, and how routing and data fetching fit together in a real application. You will finish having built a working project, and — more usefully — able to reason about why your own code re-renders.',
    whatYouWillLearn: [
      'Think in components and compose them without prop-drilling chaos',
      'Use useState, useEffect and useMemo for the jobs they are actually for',
      'Build multi-page apps with React Router and protected routes',
      'Fetch, cache and invalidate server data predictably',
      'Debug re-renders instead of guessing at them',
    ],
    requirements: ['Comfortable with HTML and CSS', 'Basic JavaScript (functions, arrays, objects)'],
    tags: ['react', 'javascript', 'frontend', 'hooks'],
    modules: [
      {
        title: 'Foundations of React',
        description: 'The mental model everything else rests on.',
        lessons: [
          {
            title: 'Why React exists: the problem it actually solves',
            summary: 'Before the syntax, the reason. What made declarative UI worth inventing.',
            videoUrl: 'https://www.youtube.com/watch?v=Tn6-PIqc4UM',
            durationMinutes: 18,
            isPreview: true,
            content:
              'Direct DOM manipulation does not scale, not because it is slow, but because keeping the screen and your data in agreement by hand becomes impossible past a certain size. React\'s bet is that you describe what the UI should look like for a given state, and let a library work out the changes. Everything that follows — components, hooks, reconciliation — is downstream of that one bet.',
            resources: [
              { title: 'React official docs: Thinking in React', type: 'link', url: 'https://react.dev/learn/thinking-in-react' },
              { title: 'Course starter files', type: 'link', url: 'https://github.com/facebook/react' },
            ],
          },
          {
            title: 'JSX and components in depth',
            summary: 'What JSX compiles to, and why that matters when debugging.',
            videoUrl: 'https://www.youtube.com/watch?v=SqcY0GlETPk',
            durationMinutes: 24,
            content:
              'JSX is not HTML and it is not a template language — it is syntax sugar for function calls. Once you can read a component as "a function that returns a description of UI", a whole class of confusing errors becomes obvious instead of mysterious.',
            resources: [
              { title: 'JSX cheat sheet', type: 'text', textContent: 'Attributes are camelCase: className, htmlFor, onClick, tabIndex.\nExpressions go in braces: {user.name}\nFragments avoid wrapper divs: <>...</>\nLists need a stable key, and the array index is rarely one.' },
            ],
            quiz: {
              title: 'JSX and components check',
              passingScore: 60,
              isRequiredForCompletion: false,
              questions: [
                {
                  text: 'What does JSX compile down to?',
                  options: [
                    { text: 'Plain HTML strings inserted into the page', isCorrect: false },
                    { text: 'Function calls that create React element objects', isCorrect: true },
                    { text: 'A template that the browser parses natively', isCorrect: false },
                    { text: 'Web Components under the hood', isCorrect: false },
                  ],
                  explanation: 'JSX becomes React.createElement (or the modern jsx runtime) calls, which return plain objects describing the UI.',
                },
                {
                  text: 'Which attribute name is correct in JSX?',
                  options: [
                    { text: 'class', isCorrect: false },
                    { text: 'className', isCorrect: true },
                    { text: 'css-class', isCorrect: false },
                    { text: 'classname', isCorrect: false },
                  ],
                  explanation: '`class` is a reserved word in JavaScript, so JSX uses className.',
                },
                {
                  text: 'Why is an array index usually a poor choice of key?',
                  options: [
                    { text: 'Indexes are slower to compare than strings', isCorrect: false },
                    { text: 'React forbids numeric keys', isCorrect: false },
                    { text: 'When the list reorders, the index no longer identifies the same item', isCorrect: true },
                    { text: 'It causes a hydration error in every case', isCorrect: false },
                  ],
                  explanation: 'Keys identify items across renders. If items move, index-based keys make React reuse the wrong DOM and component state.',
                },
              ],
            },
          },
          {
            title: 'Props, composition and where state belongs',
            summary: 'Lifting state, colocation, and the cost of getting it wrong.',
            videoUrl: 'https://www.youtube.com/watch?v=PHaECbrKgs0',
            durationMinutes: 22,
            content:
              'State placed too high causes needless re-renders and prop-drilling; state placed too low causes duplication and bugs where two components disagree. The rule of thumb: state lives at the lowest common ancestor of everything that reads it.',
            resources: [
              { title: 'Component composition patterns (PDF notes)', type: 'link', url: 'https://react.dev/learn/passing-props-to-a-component' },
            ],
          },
        ],
      },
      {
        title: 'State and Effects',
        description: 'Hooks, and the discipline they require.',
        lessons: [
          {
            title: 'useState: batching, stale values and updater functions',
            summary: 'Why your state "did not update" and what to do about it.',
            videoUrl: 'https://www.youtube.com/watch?v=O6P86uwfdR0',
            durationMinutes: 26,
            content:
              'Setting state does not mutate a variable; it schedules a re-render. Understanding that one sentence resolves most "it logs the old value" confusion. Use the updater form whenever the next value depends on the previous one.',
            resources: [
              { title: 'useState reference', type: 'link', url: 'https://react.dev/reference/react/useState' },
            ],
            quiz: {
              title: 'State management check',
              passingScore: 70,
              isRequiredForCompletion: true,
              questions: [
                {
                  text: 'Why does `setCount(count + 1)` twice in a row only increment once?',
                  options: [
                    { text: 'React throttles state updates to one per second', isCorrect: false },
                    { text: 'Both calls read the same stale `count` from that render', isCorrect: true },
                    { text: 'The second call throws an error silently', isCorrect: false },
                    { text: 'State updates must be awaited', isCorrect: false },
                  ],
                  explanation: '`count` is a constant within a given render. Use `setCount(c => c + 1)` so each update builds on the last.',
                },
                {
                  text: 'Which of these belong in a dependency array? (choose all that apply)',
                  type: 'multiple',
                  options: [
                    { text: 'Reactive values read inside the effect', isCorrect: true },
                    { text: 'Props the effect uses', isCorrect: true },
                    { text: 'Values imported at module scope that never change', isCorrect: false },
                    { text: 'Refs returned by useRef', isCorrect: false },
                  ],
                  explanation: 'Anything reactive that the effect reads goes in. Module constants and stable ref objects do not change, so they do not.',
                },
                {
                  text: 'An effect with an empty dependency array runs:',
                  options: [
                    { text: 'On every render', isCorrect: false },
                    { text: 'Only after the first render (plus cleanup on unmount)', isCorrect: true },
                    { text: 'Never', isCorrect: false },
                    { text: 'Only when state changes', isCorrect: false },
                  ],
                  explanation: 'An empty array means there are no reactive dependencies, so it runs once after mount.',
                },
              ],
            },
          },
          {
            title: 'useEffect: synchronisation, not lifecycle',
            summary: 'The reframing that makes effects click, plus cleanup.',
            videoUrl: 'https://www.youtube.com/watch?v=0ZJgIjIuY7U',
            durationMinutes: 28,
            content:
              'An effect is not "run this on mount". It is "keep this external system in sync with my state". Cleanup is not optional bookkeeping; it is half the contract. Most effect bugs are a missing cleanup or a dependency you lied about.',
            resources: [
              { title: 'You Might Not Need an Effect', type: 'link', url: 'https://react.dev/learn/you-might-not-need-an-effect' },
              { title: 'Cleanup checklist', type: 'text', textContent: 'Subscriptions: unsubscribe.\nTimers: clearTimeout / clearInterval.\nFetches: abort with AbortController, or guard with an ignore flag.\nEvent listeners: removeEventListener with the same function reference.' },
            ],
          },
        ],
      },
      {
        title: 'Routing and Data',
        description: 'Turning components into an application.',
        lessons: [
          {
            title: 'React Router: nested routes and layouts',
            summary: 'Route structure that mirrors your UI structure.',
            videoUrl: 'https://www.youtube.com/watch?v=Ul3y1LXxzdU',
            durationMinutes: 30,
            content:
              'Nested routes let a layout own its shell — navbar, sidebar, breadcrumbs — while children swap underneath. Protected routes are then just a layout that checks auth before rendering its outlet.',
            resources: [
              { title: 'React Router tutorial', type: 'link', url: 'https://reactrouter.com/en/main/start/tutorial' },
            ],
          },
          {
            title: 'Fetching data without the footguns',
            summary: 'Loading states, races, errors and cancellation.',
            videoUrl: 'https://www.youtube.com/watch?v=00lxm_doFYw',
            durationMinutes: 27,
            content:
              'Every fetch has four states, not one: idle, loading, error and success. UIs that only handle success are the reason users see blank screens. Handle all four, and cancel in-flight requests when the inputs change.',
            resources: [
              { title: 'Axios documentation', type: 'link', url: 'https://axios-http.com/docs/intro' },
            ],
            quiz: {
              title: 'Routing and data fetching check',
              passingScore: 60,
              isRequiredForCompletion: false,
              questions: [
                {
                  text: 'What renders the child route inside a parent layout?',
                  options: [
                    { text: '<Children />', isCorrect: false },
                    { text: '<Outlet />', isCorrect: true },
                    { text: '<Slot />', isCorrect: false },
                    { text: 'props.children automatically', isCorrect: false },
                  ],
                  explanation: 'React Router renders the matched child route into the parent\'s <Outlet />.',
                },
                {
                  text: 'Two searches fire and the slower, older one resolves last. What do you see?',
                  options: [
                    { text: 'The newer results, React handles it', isCorrect: false },
                    { text: 'The stale results, unless you cancel or guard', isCorrect: true },
                    { text: 'An error boundary trips', isCorrect: false },
                    { text: 'Nothing renders', isCorrect: false },
                  ],
                  explanation: 'This is a race condition. Abort the previous request or ignore responses from superseded effects.',
                },
              ],
            },
          },
        ],
      },
    ],
  },

  {
    title: 'Node.js and Express REST APIs with MongoDB',
    subtitle: 'Design, secure and ship backends you would trust in production',
    instructorEmail: 'ananya.verma@lumina.dev',
    categoryName: 'Web Development',
    level: 'intermediate',
    isFree: false,
    price: 2499,
    discountPrice: 1499,
    status: 'published',
    isFeatured: true,
    thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&q=80',
    description:
      'A backend is mostly decisions: where validation lives, how errors travel, what a token really proves, which index makes a query survive growth. This course works through those decisions on a real API — authentication, authorisation, file uploads, pagination, error handling — and explains the trade-off behind each one rather than handing you a template to copy.',
    whatYouWillLearn: [
      'Structure Express apps into routes, controllers, services and models',
      'Implement JWT authentication and role-based authorisation properly',
      'Model relational data in MongoDB without duplicating everything',
      'Validate input and return errors clients can actually act on',
      'Add indexes that matter and avoid the queries that will not scale',
    ],
    requirements: ['Solid JavaScript', 'Familiarity with HTTP basics', 'Node installed locally'],
    tags: ['node', 'express', 'mongodb', 'rest-api', 'backend'],
    modules: [
      {
        title: 'Express Fundamentals',
        lessons: [
          {
            title: 'Middleware: the whole framework in one idea',
            summary: 'Request pipelines, ordering, and why order bites people.',
            videoUrl: 'https://www.youtube.com/watch?v=lY6icfhap2o',
            durationMinutes: 25,
            isPreview: true,
            content:
              'Express is a list of functions that each get (req, res, next). That is nearly all of it. Almost every "why is req.body undefined" question is really a question about the order of that list.',
            resources: [
              { title: 'Express middleware guide', type: 'link', url: 'https://expressjs.com/en/guide/using-middleware.html' },
            ],
          },
          {
            title: 'Routing, controllers and keeping logic out of routes',
            summary: 'Structure that survives the second feature request.',
            videoUrl: 'https://www.youtube.com/watch?v=SccSCuHhOw0',
            durationMinutes: 23,
            content:
              'Route files should read like a table of contents. When business logic lives inline, every change means editing the routing table, and testing means spinning up HTTP. Push the work into controllers and services.',
            resources: [
              { title: 'Project structure notes', type: 'text', textContent: 'routes/      URL to handler mapping only\ncontrollers/ HTTP in, HTTP out; no cross-feature logic\nservices/    business rules, reusable across controllers\nmodels/      schema, indexes, instance methods\nmiddleware/  auth, validation, errors' },
            ],
          },
        ],
      },
      {
        title: 'Data and Mongoose',
        lessons: [
          {
            title: 'Schema design: reference or embed?',
            summary: 'The decision that shapes every query you write later.',
            videoUrl: 'https://www.youtube.com/watch?v=DZBGEVgL2eE',
            durationMinutes: 29,
            content:
              'Embed what you always read together and rarely update alone. Reference what is large, shared, or grows without bound. Getting this wrong is recoverable, but expensive — it shows up as either unbounded documents or a dozen populate calls per request.',
            resources: [
              { title: 'Mongoose population docs', type: 'link', url: 'https://mongoosejs.com/docs/populate.html' },
            ],
            quiz: {
              title: 'Schema design check',
              passingScore: 70,
              isRequiredForCompletion: true,
              questions: [
                {
                  text: 'A comment thread on a post can grow without limit. What should you do?',
                  options: [
                    { text: 'Embed every comment in the post document', isCorrect: false },
                    { text: 'Keep comments in their own collection referencing the post', isCorrect: true },
                    { text: 'Store them as a single JSON string field', isCorrect: false },
                    { text: 'Duplicate them in both places', isCorrect: false },
                  ],
                  explanation: 'Unbounded arrays eventually hit the 16MB document limit and make every post read expensive. Reference instead.',
                },
                {
                  text: 'What is a denormalised counter (like enrollmentCount) for?',
                  options: [
                    { text: 'Enforcing referential integrity', isCorrect: false },
                    { text: 'Avoiding a count query on every list render, at the cost of keeping it in sync', isCorrect: true },
                    { text: 'Replacing indexes', isCorrect: false },
                    { text: 'Nothing, it is always a mistake', isCorrect: false },
                  ],
                  explanation: 'It trades write-time bookkeeping for read speed. Worth it on hot paths, provided one place owns the sync.',
                },
              ],
            },
          },
          {
            title: 'Indexes, pagination and queries that scale',
            summary: 'Why your endpoint is fine at 100 rows and dead at 100,000.',
            videoUrl: 'https://www.youtube.com/watch?v=lATuGWgqDeI',
            durationMinutes: 26,
            content:
              'An unindexed sort on a growing collection is a time bomb. Learn to read explain() output, understand compound index prefixes, and know why skip-based pagination degrades deep in a list.',
            resources: [
              { title: 'MongoDB indexing strategies', type: 'link', url: 'https://www.mongodb.com/docs/manual/applications/indexes/' },
            ],
          },
        ],
      },
      {
        title: 'Authentication and Security',
        lessons: [
          {
            title: 'JWT and bcrypt: what each one actually guarantees',
            summary: 'Hashing vs encryption, and what a token does not prove.',
            videoUrl: 'https://www.youtube.com/watch?v=mbsmsi7l3r4',
            durationMinutes: 31,
            content:
              'bcrypt is deliberately slow, and that is the feature. A JWT proves a claim was signed by you; it does not prove the user still exists, is still allowed in, or has not been banned since. That is why a server-side check still belongs on protected routes.',
            resources: [
              { title: 'OWASP authentication cheat sheet', type: 'link', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html' },
              { title: 'jwt.io debugger', type: 'link', url: 'https://jwt.io' },
            ],
            quiz: {
              title: 'Authentication check',
              passingScore: 75,
              isRequiredForCompletion: true,
              questions: [
                {
                  text: 'Why hash passwords with bcrypt rather than SHA-256?',
                  options: [
                    { text: 'bcrypt output is shorter', isCorrect: false },
                    { text: 'bcrypt is intentionally slow and salted, resisting brute force', isCorrect: true },
                    { text: 'SHA-256 is reversible', isCorrect: false },
                    { text: 'bcrypt encrypts, SHA hashes', isCorrect: false },
                  ],
                  explanation: 'Fast hashes are a gift to an attacker with a leaked database. bcrypt has a tunable cost factor and per-password salt.',
                },
                {
                  text: 'Login fails. Which response is safest?',
                  options: [
                    { text: '"No account with that email"', isCorrect: false },
                    { text: '"Wrong password for this account"', isCorrect: false },
                    { text: '"Invalid email or password"', isCorrect: true },
                    { text: 'The number of remaining attempts and which field failed', isCorrect: false },
                  ],
                  explanation: 'Distinct messages let an attacker enumerate which emails are registered.',
                },
                {
                  text: 'Frontend route guards alone are sufficient protection.',
                  type: 'boolean',
                  options: [
                    { text: 'True', isCorrect: false },
                    { text: 'False', isCorrect: true },
                  ],
                  explanation: 'Anyone can call your API directly. The server must verify every permission independently.',
                },
              ],
            },
          },
          {
            title: 'Validation, error handling and safe responses',
            summary: 'One error shape, no leaked stack traces.',
            videoUrl: 'https://www.youtube.com/watch?v=DyqVqaf1KnA',
            durationMinutes: 24,
            content:
              'Validate at the edge, throw typed errors, and translate them in exactly one place. Clients then get a consistent shape they can render, and production never returns a stack trace.',
            resources: [
              { title: 'express-validator docs', type: 'link', url: 'https://express-validator.github.io/docs/' },
            ],
          },
        ],
      },
    ],
  },

  {
    title: 'Python for Data Analysis: Pandas, NumPy and Real Datasets',
    subtitle: 'From raw CSV to a defensible conclusion',
    instructorEmail: 'rohan.iyer@lumina.dev',
    categoryName: 'Data Science',
    level: 'beginner',
    isFree: true,
    price: 0,
    status: 'published',
    isFeatured: true,
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
    description:
      'Most data work is not modelling; it is cleaning, joining and checking. This course spends its time where the real effort goes: loading messy files, finding the rows that will ruin your average, reshaping data into the form your question needs, and stating a conclusion you can defend when someone pushes back on it.',
    whatYouWillLearn: [
      'Load and inspect real, messy datasets with pandas',
      'Handle missing data deliberately rather than by accident',
      'Group, pivot and join to answer actual questions',
      'Use NumPy for vectorised work instead of slow loops',
      'Present findings honestly, including their limits',
    ],
    requirements: ['Basic Python (variables, loops, functions)', 'No statistics background needed'],
    tags: ['python', 'pandas', 'numpy', 'data-analysis'],
    modules: [
      {
        title: 'Getting Data In',
        lessons: [
          {
            title: 'Reading files and first-look inspection',
            summary: 'read_csv options that save hours later.',
            videoUrl: 'https://www.youtube.com/watch?v=vmEHCJofslg',
            durationMinutes: 21,
            isPreview: true,
            content:
              'Before any analysis: shape, dtypes, head, describe, and a null count. Five commands that catch the majority of problems, including the string column that should have been numeric.',
            resources: [
              { title: 'pandas IO documentation', type: 'link', url: 'https://pandas.pydata.org/docs/user_guide/io.html' },
              { title: 'First-look checklist', type: 'text', textContent: 'df.shape\ndf.dtypes\ndf.head(10)\ndf.describe(include="all")\ndf.isna().sum()\ndf.duplicated().sum()' },
            ],
          },
          {
            title: 'Missing and messy data',
            summary: 'Dropping, filling, and when each is dishonest.',
            videoUrl: 'https://www.youtube.com/watch?v=daefaLgNkw0',
            durationMinutes: 27,
            content:
              'Filling missing values with the mean is a decision about your data, not a formality. Sometimes it is fine; sometimes it quietly manufactures a result. Decide consciously and say what you did.',
            quiz: {
              title: 'Data cleaning check',
              passingScore: 60,
              isRequiredForCompletion: false,
              questions: [
                {
                  text: 'A numeric column loaded as object dtype. The most likely cause?',
                  options: [
                    { text: 'The file was too large', isCorrect: false },
                    { text: 'Non-numeric values such as "N/A", "-" or thousands separators', isCorrect: true },
                    { text: 'pandas defaults every column to object', isCorrect: false },
                    { text: 'The column has negative values', isCorrect: false },
                  ],
                  explanation: 'One stray string forces the whole column to object. Inspect uniques, then coerce with pd.to_numeric(errors="coerce").',
                },
                {
                  text: 'When is dropping rows with missing values reasonable?',
                  options: [
                    { text: 'Always, it is the cleanest option', isCorrect: false },
                    { text: 'When they are few and plausibly missing at random', isCorrect: true },
                    { text: 'Never, always impute', isCorrect: false },
                    { text: 'Only for string columns', isCorrect: false },
                  ],
                  explanation: 'If missingness correlates with what you are measuring, dropping rows biases your result.',
                },
              ],
            },
          },
        ],
      },
      {
        title: 'Reshaping and Aggregating',
        lessons: [
          {
            title: 'groupby, agg and pivot tables',
            summary: 'Split-apply-combine, and reading the result correctly.',
            videoUrl: 'https://www.youtube.com/watch?v=txMdrV1Ut64',
            durationMinutes: 29,
            content:
              'groupby is the workhorse. Once split-apply-combine is clear, pivot tables stop looking like magic and start looking like a reshape of the same idea.',
            resources: [
              { title: 'pandas groupby user guide', type: 'link', url: 'https://pandas.pydata.org/docs/user_guide/groupby.html' },
            ],
          },
          {
            title: 'Merging datasets without silently losing rows',
            summary: 'Join types, key hygiene, and always checking the row count.',
            videoUrl: 'https://www.youtube.com/watch?v=h4hOPGo4UVU',
            durationMinutes: 25,
            content:
              'An inner join that drops a third of your rows will not warn you. Check shape before and after every merge, and validate one-to-many assumptions explicitly.',
            quiz: {
              title: 'Aggregation and joins check',
              passingScore: 70,
              isRequiredForCompletion: true,
              questions: [
                {
                  text: 'Your merge output has more rows than either input. Why?',
                  options: [
                    { text: 'pandas duplicated rows as a bug', isCorrect: false },
                    { text: 'The join key repeats on both sides, producing a many-to-many expansion', isCorrect: true },
                    { text: 'You used an outer join', isCorrect: false },
                    { text: 'Missing values were filled in', isCorrect: false },
                  ],
                  explanation: 'Duplicate keys on both sides multiply. Use validate="one_to_many" to catch it at the join.',
                },
                {
                  text: 'Which joins can drop rows? (choose all that apply)',
                  type: 'multiple',
                  options: [
                    { text: 'inner', isCorrect: true },
                    { text: 'left', isCorrect: false },
                    { text: 'right', isCorrect: false },
                    { text: 'outer', isCorrect: false },
                  ],
                  explanation: 'Only inner requires a match on both sides. left, right and outer preserve their respective rows.',
                },
              ],
            },
          },
        ],
      },
    ],
  },

  {
    title: 'UI/UX Design Foundations: Interfaces People Understand',
    subtitle: 'Hierarchy, type, colour and the research that keeps you honest',
    instructorEmail: 'meera.nair@lumina.dev',
    categoryName: 'Design',
    level: 'beginner',
    isFree: true,
    price: 0,
    status: 'published',
    thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80',
    description:
      'Good interface design is mostly restraint plus a few principles applied consistently. This course covers visual hierarchy, type, colour and spacing as tools with jobs, then the usability testing that tells you whether your choices worked — because taste is not evidence and five users will humble you faster than any critique.',
    whatYouWillLearn: [
      'Build visual hierarchy with size, weight, spacing and contrast',
      'Choose and pair typefaces without guesswork',
      'Use colour for meaning, and meet contrast requirements',
      'Design with a spacing scale instead of arbitrary pixels',
      'Run a usability test that produces findings you can act on',
    ],
    requirements: ['No design background needed', 'Figma free account'],
    tags: ['ui', 'ux', 'design', 'figma', 'accessibility'],
    modules: [
      {
        title: 'Visual Principles',
        lessons: [
          {
            title: 'Hierarchy: guiding the eye on purpose',
            summary: 'Why everything important means nothing is.',
            videoUrl: 'https://www.youtube.com/watch?v=YqQx75OPRa0',
            durationMinutes: 20,
            isPreview: true,
            content:
              'Hierarchy is a ranking, and a ranking requires losers. If three elements are all bold, large and coloured, you have expressed no priority at all. Decide what is first, and let the rest be quieter.',
            resources: [
              { title: 'Refactoring UI (reference)', type: 'link', url: 'https://www.refactoringui.com/' },
            ],
          },
          {
            title: 'Typography and spacing systems',
            summary: 'Scales, line length, rhythm.',
            videoUrl: 'https://www.youtube.com/watch?v=sByzHoiYFX0',
            durationMinutes: 26,
            content:
              'Pick a type scale and a spacing scale, then stay inside them. Consistency reads as quality, and a constrained palette of sizes removes a hundred small decisions per screen.',
            resources: [
              { title: 'Type scale generator', type: 'link', url: 'https://typescale.com/' },
              { title: 'Spacing scale notes', type: 'text', textContent: 'A 4px base scale covers almost everything: 4, 8, 12, 16, 24, 32, 48, 64.\nBody text: 16px minimum on mobile.\nLine length: 45-75 characters.\nLine height: ~1.5 for body, tighter for headings.' },
            ],
            quiz: {
              title: 'Visual design check',
              passingScore: 60,
              isRequiredForCompletion: false,
              questions: [
                {
                  text: 'Minimum WCAG AA contrast ratio for normal body text?',
                  options: [
                    { text: '2:1', isCorrect: false },
                    { text: '3:1', isCorrect: false },
                    { text: '4.5:1', isCorrect: true },
                    { text: '7:1', isCorrect: false },
                  ],
                  explanation: '4.5:1 for normal text, 3:1 for large text. 7:1 is the stricter AAA level.',
                },
                {
                  text: 'Comfortable line length for body copy?',
                  options: [
                    { text: '20-30 characters', isCorrect: false },
                    { text: '45-75 characters', isCorrect: true },
                    { text: '100-120 characters', isCorrect: false },
                    { text: 'As wide as the container', isCorrect: false },
                  ],
                  explanation: 'Beyond roughly 75 characters the eye struggles to find the next line.',
                },
              ],
            },
          },
        ],
      },
      {
        title: 'Research and Testing',
        lessons: [
          {
            title: 'Usability testing with five users',
            summary: 'Tasks, not opinions. Watching, not asking.',
            videoUrl: 'https://www.youtube.com/watch?v=0YL0xoSmyZI',
            durationMinutes: 23,
            content:
              'Ask someone whether they like a design and they will be polite. Give them a task and watch where they hesitate, and you will learn something true. Five users surfaces most severe issues.',
            resources: [
              { title: 'Nielsen Norman: why five users', type: 'link', url: 'https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/' },
            ],
          },
        ],
      },
    ],
  },

  {
    title: 'AWS and Kubernetes: Deploying Applications That Stay Up',
    subtitle: 'Containers, orchestration, CI/CD and the boring practices that work',
    instructorEmail: 'arjun.desai@lumina.dev',
    categoryName: 'Cloud & DevOps',
    level: 'advanced',
    isFree: false,
    price: 3999,
    discountPrice: 2799,
    status: 'published',
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80',
    description:
      'Deployment stops being frightening when it is repeatable. This course covers containerising an application properly, running it on Kubernetes, wiring a pipeline that can roll back, and the observability you need before an incident rather than during one. Opinionated, and explicit about which complexity is worth it and which is fashion.',
    whatYouWillLearn: [
      'Write Dockerfiles that are small, cached and reproducible',
      'Deploy to Kubernetes with health checks and resource limits',
      'Build CI/CD pipelines that can roll back safely',
      'Manage configuration and secrets without committing them',
      'Set up logging, metrics and alerts that are actually actionable',
    ],
    requirements: ['Comfortable on the Linux command line', 'Have deployed something before', 'Basic networking (DNS, ports, TLS)'],
    tags: ['aws', 'kubernetes', 'docker', 'devops', 'ci-cd'],
    modules: [
      {
        title: 'Containers',
        lessons: [
          {
            title: 'Docker images, layers and cache',
            summary: 'Why your build takes six minutes and how to fix it.',
            videoUrl: 'https://www.youtube.com/watch?v=pTFZFxd4hOI',
            durationMinutes: 32,
            isPreview: true,
            content:
              'Layer order is a caching strategy. Copy your lockfile and install dependencies before copying source, and most rebuilds become near-instant. Multi-stage builds then keep the toolchain out of the shipped image.',
            resources: [
              { title: 'Dockerfile best practices', type: 'link', url: 'https://docs.docker.com/develop/develop-images/dockerfile_best-practices/' },
            ],
            quiz: {
              title: 'Docker check',
              passingScore: 70,
              isRequiredForCompletion: true,
              questions: [
                {
                  text: 'Why copy package.json and install before copying the rest of the source?',
                  options: [
                    { text: 'npm requires it', isCorrect: false },
                    { text: 'So the dependency layer stays cached when only source changes', isCorrect: true },
                    { text: 'It reduces the final image size', isCorrect: false },
                    { text: 'To avoid permission errors', isCorrect: false },
                  ],
                  explanation: 'Any changed layer invalidates every layer after it. Install rarely changes; source changes constantly.',
                },
                {
                  text: 'What is a multi-stage build for?',
                  options: [
                    { text: 'Running several containers at once', isCorrect: false },
                    { text: 'Building with a full toolchain, then shipping only the artefacts', isCorrect: true },
                    { text: 'Parallelising the build', isCorrect: false },
                    { text: 'Supporting multiple architectures', isCorrect: false },
                  ],
                  explanation: 'Compilers and dev dependencies stay in the build stage; the runtime image carries only what it needs.',
                },
              ],
            },
          },
        ],
      },
      {
        title: 'Kubernetes',
        lessons: [
          {
            title: 'Pods, deployments and services',
            summary: 'The three objects behind most of what you will run.',
            videoUrl: 'https://www.youtube.com/watch?v=X48VuDVv0do',
            durationMinutes: 35,
            content:
              'A deployment manages replica sets, which manage pods. A service gives that changing set of pods one stable address. Most confusion early on is expecting a pod to be durable — it is not, and that is the point.',
            resources: [
              { title: 'Kubernetes concepts', type: 'link', url: 'https://kubernetes.io/docs/concepts/' },
            ],
          },
          {
            title: 'Probes, limits and rolling updates',
            summary: 'How a cluster knows your app is healthy.',
            videoUrl: 'https://www.youtube.com/watch?v=s_o8dwzRlu4',
            durationMinutes: 28,
            content:
              'Without a readiness probe, Kubernetes sends traffic to a process that is still starting. Without resource limits, one hungry pod degrades its neighbours. These are not optional extras.',
          },
        ],
      },
    ],
  },

  {
    title: 'TypeScript in Practice: Types That Prevent Real Bugs',
    subtitle: 'Beyond annotations — inference, narrowing and honest types',
    instructorEmail: 'ananya.verma@lumina.dev',
    categoryName: 'Web Development',
    level: 'intermediate',
    isFree: true,
    price: 0,
    status: 'published',
    thumbnail: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=800&q=80',
    description:
      'TypeScript pays off when your types describe what the code actually does. This course covers inference, narrowing, generics and discriminated unions, and spends real time on the escape hatches — `any`, assertions, non-null `!` — and the cost of reaching for them.',
    whatYouWillLearn: [
      'Let inference work for you instead of annotating everything',
      'Narrow union types safely with guards',
      'Write generics that are useful rather than decorative',
      'Model state with discriminated unions so invalid states cannot compile',
      'Type third-party and API data at the boundary',
    ],
    requirements: ['Solid JavaScript', 'Some experience with a JS framework helps'],
    tags: ['typescript', 'javascript', 'types'],
    modules: [
      {
        title: 'The Type System',
        lessons: [
          {
            title: 'Inference, annotations and when to write which',
            summary: 'Less typing, better types.',
            videoUrl: 'https://www.youtube.com/watch?v=d56mG7DezGs',
            durationMinutes: 24,
            isPreview: true,
            content:
              'Annotate the boundaries — function parameters, exported signatures, external data — and let inference handle the middle. Over-annotating adds noise and can make types worse than what the compiler would have worked out.',
            resources: [
              { title: 'TypeScript handbook', type: 'link', url: 'https://www.typescriptlang.org/docs/handbook/intro.html' },
            ],
          },
          {
            title: 'Narrowing and discriminated unions',
            summary: 'Making illegal states unrepresentable.',
            videoUrl: 'https://www.youtube.com/watch?v=hBk4nV7q6-w',
            durationMinutes: 27,
            content:
              'A single object with optional data, error and loading fields permits states that make no sense. A discriminated union on `status` makes those states impossible to construct, and the compiler starts catching bugs you would otherwise ship.',
            quiz: {
              title: 'Types check',
              passingScore: 70,
              isRequiredForCompletion: false,
              questions: [
                {
                  text: 'What does `unknown` give you over `any`?',
                  options: [
                    { text: 'Nothing, they are aliases', isCorrect: false },
                    { text: '`unknown` must be narrowed before use, so it stays type-safe', isCorrect: true },
                    { text: '`unknown` is faster to compile', isCorrect: false },
                    { text: '`unknown` only works with objects', isCorrect: false },
                  ],
                  explanation: '`any` disables checking entirely. `unknown` forces you to prove the type before using the value.',
                },
                {
                  text: 'Why prefer a discriminated union for request state?',
                  options: [
                    { text: 'It is shorter to write', isCorrect: false },
                    { text: 'It makes contradictory combinations impossible to represent', isCorrect: true },
                    { text: 'It removes the need for error handling', isCorrect: false },
                    { text: 'It improves runtime performance', isCorrect: false },
                  ],
                  explanation: 'loading-and-error-at-once simply cannot be constructed, so you never have to handle it.',
                },
              ],
            },
          },
        ],
      },
    ],
  },

  // Sits in the admin approval queue, so the workflow has something real to act on.
  {
    title: 'Flutter Cross-Platform Apps: One Codebase, Two Stores',
    subtitle: 'Widgets, state management and shipping to iOS and Android',
    instructorEmail: 'arjun.desai@lumina.dev',
    categoryName: 'Mobile Development',
    level: 'intermediate',
    isFree: false,
    price: 2999,
    status: 'pending',
    thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80',
    description:
      'Flutter genuinely delivers one codebase for both stores, provided you understand its widget model and stop fighting its layout system. This course builds a complete app from widgets through state management to a signed release build, including the platform-specific parts nobody warns you about.',
    whatYouWillLearn: [
      'Compose UI from stateless and stateful widgets',
      'Handle layout and constraints without guessing',
      'Manage state at app scale',
      'Call REST APIs and persist data locally',
      'Build and sign releases for both stores',
    ],
    requirements: ['Some programming experience', 'Dart basics are covered from scratch'],
    tags: ['flutter', 'dart', 'mobile', 'ios', 'android'],
    modules: [
      {
        title: 'Widgets and Layout',
        lessons: [
          {
            title: 'Everything is a widget',
            summary: 'The composition model Flutter is built on.',
            videoUrl: 'https://www.youtube.com/watch?v=1ukSR1GRtMU',
            durationMinutes: 22,
            content:
              'Padding is a widget. Centering is a widget. Once you accept that composition replaces the styling properties you are used to, Flutter layout becomes predictable rather than surprising.',
          },
          {
            title: 'Constraints: how Flutter lays out',
            summary: 'Constraints down, sizes up, parent sets position.',
            videoUrl: 'https://www.youtube.com/watch?v=jckqXR5CrPI',
            durationMinutes: 25,
            content:
              'That one sentence — constraints go down, sizes go up, the parent sets position — explains nearly every unbounded-height error you will hit.',
          },
        ],
      },
    ],
  },

  // A draft, so the instructor dashboard shows the pre-submission state.
  {
    title: 'Practical Cybersecurity for Developers',
    subtitle: 'Threat modelling, secure defaults and fixing the OWASP Top 10',
    instructorEmail: 'arjun.desai@lumina.dev',
    categoryName: 'Cybersecurity',
    level: 'intermediate',
    isFree: true,
    price: 0,
    status: 'draft',
    thumbnail: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80',
    description:
      'Security is a set of habits, not a final audit. This course covers threat modelling you can do in an afternoon, the defaults that remove whole bug classes, and how the OWASP Top 10 shows up in ordinary application code — written for developers shipping features, not for specialists.',
    whatYouWillLearn: [
      'Threat model a feature before building it',
      'Recognise injection, broken access control and misconfiguration in real code',
      'Handle secrets and dependencies responsibly',
      'Choose defaults that make insecure usage awkward',
    ],
    requirements: ['Experience building web applications'],
    tags: ['security', 'owasp', 'appsec'],
    modules: [
      {
        title: 'Thinking About Risk',
        lessons: [
          {
            title: 'Threat modelling in one afternoon',
            summary: 'What are we building, what can go wrong, what do we do.',
            videoUrl: 'https://www.youtube.com/watch?v=ZoxHTr5nDYs',
            durationMinutes: 26,
            content:
              'Four questions get you most of the value: what are we building, what can go wrong, what are we going to do about it, and did we do a good job? You do not need a framework to start.',
          },
        ],
      },
    ],
  },

  // Rejected, so the rejection-feedback loop is visible end to end.
  {
    title: 'Quick Crypto Trading Bot Course',
    subtitle: 'Automated trading strategies',
    instructorEmail: 'rohan.iyer@lumina.dev',
    categoryName: 'Business',
    level: 'beginner',
    isFree: false,
    price: 4999,
    status: 'rejected',
    rejectionReason:
      'The course promises guaranteed returns, which we do not allow, and the outline has only one thin lesson. Please remove the financial claims and build out the curriculum before resubmitting.',
    thumbnail: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&q=80',
    description:
      'A short introduction to automating trading strategies with Python scripts and exchange APIs. Submitted for review before the curriculum was finished.',
    whatYouWillLearn: ['Connect to an exchange API', 'Backtest a simple strategy'],
    requirements: ['Python basics'],
    tags: ['trading', 'python'],
    modules: [
      {
        title: 'Introduction',
        lessons: [
          {
            title: 'Course overview',
            summary: 'What this course covers.',
            durationMinutes: 8,
            content: 'An outline of the material planned for this course.',
          },
        ],
      },
    ],
  },
];

/**
 * Reviews to attach after enrolment. Matched to courses by title prefix so the
 * data stays readable; the seeder resolves them to ids.
 */
const reviews = [
  {
    courseTitleStartsWith: 'Modern React',
    studentEmail: 'kavya.reddy@example.com',
    rating: 5,
    title: 'Finally understood why my components re-render',
    comment:
      'I had done two other React courses and still could not explain what a dependency array was for. The section on effects as synchronisation rather than lifecycle was the thing that made it click. Pace is brisk but nothing is hand-waved.',
  },
  {
    courseTitleStartsWith: 'Modern React',
    studentEmail: 'ishaan.malhotra@example.com',
    rating: 4,
    title: 'Strong content, wanted more on testing',
    comment:
      'The explanations are genuinely good and the project is not a toy. My one gripe is that testing barely comes up, and that is a real part of working with React. Still worth the time.',
  },
  {
    courseTitleStartsWith: 'Modern React',
    studentEmail: 'sara.khan@example.com',
    rating: 5,
    title: 'Filled in the gaps I had after two years of work',
    comment:
      'I write React professionally and still learned things, particularly around where state should live and why prop-drilling is a symptom rather than the disease.',
  },
  {
    courseTitleStartsWith: 'Python for Data Analysis',
    studentEmail: 'nikita.joshi@example.com',
    rating: 5,
    title: 'Teaches the unglamorous parts properly',
    comment:
      'Most courses skip straight to plotting. This one spends real time on missing data and joins, which is where I was actually getting things wrong at work. The bit about checking row counts after every merge has already saved me once.',
  },
  {
    courseTitleStartsWith: 'Python for Data Analysis',
    studentEmail: 'dev.patel@example.com',
    rating: 4,
    comment:
      'Clear and practical. Would have liked a longer section on visualisation, but what is here is solid and the datasets are realistic rather than sanitised.',
  },
  {
    courseTitleStartsWith: 'UI/UX Design Foundations',
    studentEmail: 'sara.khan@example.com',
    rating: 5,
    title: 'Changed how I look at my own screens',
    comment:
      '"A ranking requires losers" is going to stay with me. I went back through our product afterwards and found four screens where I had made everything important. Accessibility is treated as a requirement, not a footnote.',
  },
  {
    courseTitleStartsWith: 'Node.js and Express',
    studentEmail: 'aditya.rao@example.com',
    rating: 5,
    title: 'The authorisation section alone was worth it',
    comment:
      'I had been relying on frontend route guards and genuinely had not thought through that anyone can just call the API. Uncomfortable lesson, well taught.',
  },
  {
    courseTitleStartsWith: 'Node.js and Express',
    studentEmail: 'kavya.reddy@example.com',
    rating: 4,
    comment:
      'Dense in a good way. The schema design module made me restructure a project I had already shipped. Some videos assume more HTTP knowledge than the prerequisites suggest.',
  },
  {
    courseTitleStartsWith: 'TypeScript in Practice',
    studentEmail: 'ishaan.malhotra@example.com',
    rating: 4,
    title: 'Good on the escape hatches',
    comment:
      'Most TypeScript material pretends `any` does not exist. Being honest about when people reach for it, and what it costs, made the rest more credible.',
  },
  {
    courseTitleStartsWith: 'AWS and Kubernetes',
    studentEmail: 'aditya.rao@example.com',
    rating: 5,
    title: 'Opinionated, and right to be',
    comment:
      'The distinction between complexity that earns its keep and complexity that is fashion is the most useful thing I have heard about Kubernetes. Readiness probes are not optional — learned that the hard way before this course.',
  },
];

module.exports = { categories, instructors, students, courses, reviews };
