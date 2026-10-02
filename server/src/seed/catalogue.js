/**
 * The wider course catalogue.
 *
 * `seedData.js` holds nine deeply authored courses with full lesson bodies,
 * resources and quizzes. This file adds the rest of the catalogue: each course
 * is a real, distinct subject with its own outline, outcomes and requirements,
 * expanded by the seeder into modules, lessons and (where marked) a quiz.
 *
 * Every entry is a genuinely different course — no title is a variation of
 * another, and each one's curriculum is written for its own subject.
 *
 * Fields:
 *   title, subtitle, description, categoryName, level, price (0 = free),
 *   discount, tags, learn[], requirements[], thumbnail,
 *   modules: [{ title, lessons: [string] }]
 */

const c = (data) => data;

const catalogue = [
  /* ── Web Development ───────────────────────────────────────────────────── */
  c({
    title: 'HTML and CSS Foundations: Building for the Real Web',
    subtitle: 'Semantic markup, modern layout and the accessibility you cannot bolt on later',
    categoryName: 'Web Development',
    level: 'beginner',
    price: 0,
    tags: ['html', 'css', 'accessibility', 'frontend'],
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
    description:
      'Most people learn HTML as a list of tags and CSS as a list of properties, then wonder why their pages fall apart on a phone or in a screen reader. This course teaches the document first: what the browser does with your markup, why semantics change behaviour rather than just style, and how the modern layout engines actually resolve a size. You will build pages that survive contact with real content.',
    learn: [
      'Write markup that describes meaning, not appearance',
      'Lay out pages with flexbox and grid without guesswork',
      'Make a page keyboard-navigable and screen-reader friendly',
      'Control the cascade instead of fighting it with !important',
      'Build responsive layouts from content outward, not breakpoint inward',
    ],
    requirements: ['A text editor and a browser', 'No prior coding experience'],
    modules: [
      {
        title: 'The Document',
        lessons: [
          'What the browser actually does with your HTML',
          'Semantic elements and why they change behaviour',
          'Forms, labels and the accessibility tree',
        ],
      },
      {
        title: 'Styling with Intent',
        lessons: [
          'The cascade, specificity and inheritance',
          'The box model and why your margins collapse',
          'Custom properties and design tokens',
        ],
      },
      {
        title: 'Modern Layout',
        lessons: [
          'Flexbox: one dimension, done properly',
          'Grid: two dimensions and named areas',
          'Responsive design without breakpoint soup',
        ],
      },
    ],
    quizAt: { module: 2, title: 'Layout and the cascade check' },
  }),

  c({
    title: 'JavaScript Deep Dive: Closures, Prototypes and the Event Loop',
    subtitle: 'The language mechanics that explain every confusing bug you have hit',
    categoryName: 'JavaScript',
    level: 'intermediate',
    price: 1999,
    discount: 1299,
    tags: ['javascript', 'closures', 'async', 'event-loop'],
    thumbnail: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800&q=80',
    description:
      'You can write JavaScript for years and still be surprised by it. That surprise almost always traces back to four things: how scope is captured, how `this` is bound, how the prototype chain resolves a property, and when the event loop decides to run your callback. This course takes each one apart with runnable examples until the surprises stop.',
    learn: [
      'Explain exactly what a closure captures and when',
      'Predict the value of `this` in any call site',
      'Trace property lookup through the prototype chain',
      'Order microtasks and macrotasks correctly',
      'Debug async code without scattering console.log',
    ],
    requirements: ['Comfortable writing basic JavaScript', 'Familiarity with functions and objects'],
    modules: [
      {
        title: 'Scope and Closures',
        lessons: [
          'Execution contexts and the scope chain',
          'Closures: what is captured, and what it costs',
          'The classic loop-variable trap, and three fixes',
        ],
      },
      {
        title: 'Objects and Prototypes',
        lessons: [
          'Property lookup and the prototype chain',
          'The four rules of `this` binding',
          'Classes as syntax over prototypes',
        ],
      },
      {
        title: 'Asynchrony',
        lessons: [
          'The event loop, the call stack and the queues',
          'Promises: states, chaining and error propagation',
          'async/await, and where it hides a sequential bottleneck',
        ],
      },
    ],
    quizAt: { module: 2, title: 'Async and the event loop check', required: true },
  }),

  c({
    title: 'Next.js in Production: Rendering Strategies That Fit Your Data',
    subtitle: 'Server components, caching and choosing SSR, SSG or ISR on purpose',
    categoryName: 'Web Development',
    level: 'advanced',
    price: 3499,
    discount: 2499,
    tags: ['nextjs', 'react', 'ssr', 'performance'],
    thumbnail: 'https://images.unsplash.com/photo-1618477247222-acbdb0e159b3?w=800&q=80',
    description:
      'Next.js gives you four ways to render a page and very little guidance on which to use. That choice is not a preference — it follows from how often your data changes and who is allowed to see it. This course builds the decision framework, then works through caching, server components and the deployment details that decide whether your app is fast or merely modern.',
    learn: [
      'Pick SSR, SSG, ISR or client rendering from the data, not from habit',
      'Use server components without leaking secrets to the client',
      'Reason about the caching layers and invalidate deliberately',
      'Stream a page so the first paint does not wait on the slowest query',
      'Instrument and read Core Web Vitals from real traffic',
    ],
    requirements: ['Solid React', 'Comfortable with async JavaScript', 'Some Node experience'],
    modules: [
      {
        title: 'Rendering Decisions',
        lessons: [
          'Four rendering modes and the question that picks one',
          'Server components: what runs where',
          'Streaming and Suspense boundaries that matter',
        ],
      },
      {
        title: 'Data and Caching',
        lessons: [
          'The caching layers, and how they interact',
          'Revalidation: time-based, tag-based and on-demand',
          'Mutations and keeping the cache honest',
        ],
      },
      {
        title: 'Shipping It',
        lessons: [
          'Environment boundaries and secret safety',
          'Measuring Core Web Vitals in production',
        ],
      },
    ],
    quizAt: { module: 0, title: 'Rendering strategy check' },
  }),

  c({
    title: 'Vue 3 from the Composition API Up',
    subtitle: 'Reactivity, composables and an app that scales past the tutorial',
    categoryName: 'Web Development',
    level: 'beginner',
    price: 0,
    tags: ['vue', 'composition-api', 'frontend', 'reactivity'],
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80',
    description:
      "Vue's reactivity is the most approachable of the major frameworks and the easiest to misuse once an app grows. This course starts with how `ref` and `reactive` actually track dependencies, then builds toward composables — the unit of reuse that replaces the mixin mess — and a component architecture that still makes sense at fifty screens.",
    learn: [
      'Understand how Vue tracks and triggers reactive dependencies',
      'Choose between ref and reactive with a reason',
      'Extract logic into composables instead of mixins',
      'Manage app state with Pinia',
      'Structure routes and layouts for a growing app',
    ],
    requirements: ['Basic JavaScript', 'Familiarity with HTML and CSS'],
    modules: [
      {
        title: 'Reactivity',
        lessons: ['How Vue tracks dependencies', 'ref versus reactive', 'Computed values and watchers'],
      },
      {
        title: 'Components and Composables',
        lessons: ['Props, emits and the component contract', 'Writing your first composable', 'Slots and flexible components'],
      },
      {
        title: 'Application Scale',
        lessons: ['State with Pinia', 'Routing and layouts'],
      },
    ],
  }),

  c({
    title: 'Web Performance: Making Slow Pages Fast',
    subtitle: 'Measure first, then fix what the numbers actually point at',
    categoryName: 'Web Development',
    level: 'intermediate',
    price: 2299,
    tags: ['performance', 'web-vitals', 'optimisation', 'frontend'],
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
    description:
      'Performance work goes wrong when it starts with opinions. This course starts with measurement: what each Core Web Vital represents, how to capture it from real users rather than your laptop, and how to read a flame chart. Only then does it get into fixes — bundle splitting, image strategy, font loading, and the render-blocking work most sites do without noticing.',
    learn: [
      'Read a performance trace and find the real bottleneck',
      'Capture field data instead of trusting a local Lighthouse run',
      'Cut bundle size with splitting and honest dependency audits',
      'Serve images and fonts without blocking the first paint',
      'Prevent layout shift rather than chasing it',
    ],
    requirements: ['Experience building web pages', 'Comfortable with browser developer tools'],
    modules: [
      {
        title: 'Measuring',
        lessons: ['What LCP, INP and CLS actually measure', 'Lab data versus field data', 'Reading a flame chart'],
      },
      {
        title: 'Fixing',
        lessons: ['Bundle splitting and dependency weight', 'Images: format, sizing and lazy loading', 'Fonts without the flash', 'Eliminating layout shift'],
      },
    ],
    quizAt: { module: 0, title: 'Web vitals check' },
  }),

  /* ── Programming ───────────────────────────────────────────────────────── */
  c({
    title: 'Data Structures and Algorithms with JavaScript',
    subtitle: 'The structures worth knowing, and when each one earns its complexity',
    categoryName: 'Programming',
    level: 'intermediate',
    price: 2799,
    discount: 1899,
    tags: ['algorithms', 'data-structures', 'interview', 'javascript'],
    thumbnail: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&q=80',
    description:
      'Algorithm courses tend to be either interview drills or theory with no code. This one sits in between: each structure is built from scratch, profiled against a realistic workload, and then judged on when it is actually the right choice. You will leave able to say why a hash map beats a sorted array here and loses there.',
    learn: [
      'Reason about time and space complexity without memorising tables',
      'Implement lists, stacks, queues, trees, heaps and graphs',
      'Choose the structure that fits the access pattern',
      'Recognise the handful of patterns most problems reduce to',
      'Profile a real workload rather than guessing',
    ],
    requirements: ['Comfortable with JavaScript', 'Basic familiarity with functions and recursion'],
    modules: [
      {
        title: 'Foundations',
        lessons: ['Complexity without the hand-waving', 'Arrays and linked lists in practice', 'Stacks, queues and their real uses'],
      },
      {
        title: 'Trees and Heaps',
        lessons: ['Binary search trees and balance', 'Heaps and priority queues', 'Tries and prefix problems'],
      },
      {
        title: 'Graphs and Patterns',
        lessons: ['Representing graphs', 'BFS, DFS and shortest paths', 'Two pointers, sliding window and memoisation'],
      },
    ],
    quizAt: { module: 0, title: 'Complexity and structures check', required: true },
  }),

  c({
    title: 'Clean Code: Writing Software Other People Can Change',
    subtitle: 'Naming, structure and the refactoring habits that keep a codebase alive',
    categoryName: 'Programming',
    level: 'intermediate',
    price: 1799,
    tags: ['clean-code', 'refactoring', 'craft', 'design'],
    thumbnail: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800&q=80',
    description:
      'Code is read far more often than it is written, usually by someone who has lost the context you had. This course is about that reader. It covers naming that removes the need for comments, functions that do one thing at one level of abstraction, and the refactoring moves that turn a tangle into something you can reason about — with honest discussion of where the advice stops applying.',
    learn: [
      'Name things so the comment becomes unnecessary',
      'Keep a function at a single level of abstraction',
      'Recognise the common code smells by sight',
      'Apply the core refactorings safely, in small steps',
      'Know when "clean" advice is costing more than it returns',
    ],
    requirements: ['A year or so of programming in any language'],
    modules: [
      {
        title: 'Reading and Naming',
        lessons: ['Why code is read more than written', 'Names that carry intent', 'Comments: the good ones and the lies'],
      },
      {
        title: 'Structure',
        lessons: ['Functions at one level of abstraction', 'Reducing parameters and hidden coupling', 'Error handling that does not obscure the path'],
      },
      {
        title: 'Refactoring',
        lessons: ['Smells worth acting on', 'Safe refactoring in small steps', 'When to leave it alone'],
      },
    ],
  }),

  c({
    title: 'Git and GitHub for Teams',
    subtitle: 'Branching, reviewing and recovering when history goes wrong',
    categoryName: 'Programming',
    level: 'beginner',
    price: 0,
    tags: ['git', 'github', 'version-control', 'collaboration'],
    thumbnail: 'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=800&q=80',
    description:
      'Git makes sense the moment you stop thinking in files and start thinking in commits and pointers. This course builds that model, then uses it to explain branching, merging, rebasing and the recovery commands that feel terrifying until you understand what they move. Includes the team workflow and review practices that make the tool worth it.',
    learn: [
      'Think in commits, branches and pointers rather than file states',
      'Choose between merge and rebase with a reason',
      'Resolve conflicts calmly',
      'Recover lost work with reflog and reset',
      'Run a review process that catches things without stalling delivery',
    ],
    requirements: ['Comfortable on a command line'],
    modules: [
      {
        title: 'The Model',
        lessons: ['Commits, trees and pointers', 'Branches are just labels', 'Staging, and why it exists'],
      },
      {
        title: 'Working Together',
        lessons: ['Merge versus rebase', 'Resolving conflicts', 'Pull requests and useful review'],
      },
      {
        title: 'Recovery',
        lessons: ['reflog: nothing is really lost', 'reset, revert and checkout compared'],
      },
    ],
    quizAt: { module: 0, title: 'Git model check' },
  }),

  c({
    title: 'Go for Backend Engineers',
    subtitle: 'Goroutines, channels and services that stay simple under load',
    categoryName: 'Programming',
    level: 'intermediate',
    price: 2999,
    tags: ['golang', 'concurrency', 'backend', 'services'],
    thumbnail: 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=800&q=80',
    description:
      "Go's appeal is that a service written by a stranger is usually readable. That comes from a small language and strong conventions, not from cleverness. This course covers the language quickly, then spends its time on the concurrency model, error handling discipline, and the project layout that keeps a Go service boring in the best sense.",
    learn: [
      'Write idiomatic Go rather than translated Java',
      'Use goroutines and channels without leaking either',
      'Handle errors explicitly and usefully',
      'Structure a service that stays navigable',
      'Test with the standard library and table-driven tests',
    ],
    requirements: ['Experience in another programming language', 'Basic HTTP knowledge'],
    modules: [
      {
        title: 'The Language',
        lessons: ['Types, structs and interfaces', 'Errors as values', 'Slices and maps in practice'],
      },
      {
        title: 'Concurrency',
        lessons: ['Goroutines and the scheduler', 'Channels and select', 'Context, cancellation and leak prevention'],
      },
      {
        title: 'Services',
        lessons: ['Project layout that scales', 'Table-driven testing'],
      },
    ],
    quizAt: { module: 1, title: 'Concurrency check', required: true },
  }),

  c({
    title: 'Rust Fundamentals: Ownership Without the Fight',
    subtitle: 'Borrowing, lifetimes and why the compiler is on your side',
    categoryName: 'Programming',
    level: 'advanced',
    price: 3299,
    tags: ['rust', 'systems', 'memory-safety', 'ownership'],
    thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
    description:
      'Everyone bounces off the borrow checker once. The way through is not memorising rules but understanding the question it is asking: who owns this value, and how long does that reference need to live. This course builds ownership intuition first, so lifetimes stop being annotations you copy from Stack Overflow and start being something you can reason about.',
    learn: [
      'Explain ownership, borrowing and moves in your own words',
      'Read and write lifetime annotations deliberately',
      'Model errors with Result and the ? operator',
      'Use traits and generics for real abstraction',
      'Know when Rc, RefCell and unsafe are justified',
    ],
    requirements: ['Solid experience in another systems or application language', 'Comfort with pointers or references helps'],
    modules: [
      {
        title: 'Ownership',
        lessons: ['Moves, copies and the stack', 'Borrowing rules and what they prevent', 'Lifetimes as a question, not an annotation'],
      },
      {
        title: 'Abstraction',
        lessons: ['Traits and generic bounds', 'Result, Option and the ? operator', 'Iterators and zero-cost abstraction'],
      },
      {
        title: 'Escape Hatches',
        lessons: ['Rc, RefCell and interior mutability', 'When unsafe is the right call'],
      },
    ],
    quizAt: { module: 0, title: 'Ownership check', required: true },
  }),

  /* ── Python ────────────────────────────────────────────────────────────── */
  c({
    title: 'Python Programming: From Syntax to Real Programs',
    subtitle: 'The language, its idioms, and writing code that reads like Python',
    categoryName: 'Python',
    level: 'beginner',
    price: 0,
    tags: ['python', 'beginner', 'programming'],
    thumbnail: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&q=80',
    description:
      'Python is easy to start and easy to write badly. This course teaches the language alongside its idioms, so from the beginning you write comprehensions rather than accumulator loops, context managers rather than manual cleanup, and functions that compose. Ends with a small real program rather than another list of exercises.',
    learn: [
      'Work confidently with the core data types and their methods',
      'Write comprehensions and generators where they belong',
      'Use functions, arguments and scope correctly',
      'Handle files and errors with context managers',
      'Organise code into modules and packages',
    ],
    requirements: ['No programming experience needed'],
    modules: [
      {
        title: 'The Basics',
        lessons: ['Values, names and types', 'Control flow and truthiness', 'Lists, dicts, sets and tuples'],
      },
      {
        title: 'Writing Pythonic Code',
        lessons: ['Comprehensions and when not to use them', 'Functions, defaults and the mutable-default trap', 'Generators and laziness'],
      },
      {
        title: 'Real Programs',
        lessons: ['Files, context managers and cleanup', 'Exceptions that help the caller', 'Modules, packages and imports'],
      },
    ],
    quizAt: { module: 1, title: 'Pythonic idioms check' },
  }),

  c({
    title: 'Django REST Framework: APIs That Survive Requirements',
    subtitle: 'Serializers, viewsets, permissions and the ORM queries behind them',
    categoryName: 'Python',
    level: 'intermediate',
    price: 2899,
    discount: 1999,
    tags: ['django', 'python', 'rest-api', 'backend'],
    thumbnail: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&q=80',
    description:
      'DRF gives you a working API in twenty lines and a mystery in two hundred. This course makes the magic legible: what a serializer really does, how viewsets map to routes, where permissions are evaluated, and — the part that bites hardest — what SQL your innocent-looking serializer just generated for every row in the list.',
    learn: [
      'Model data with the ORM and read the SQL it produces',
      'Write serializers for nested and computed data',
      'Choose between APIView, generics and viewsets deliberately',
      'Implement object-level permissions correctly',
      'Find and fix N+1 queries before they reach production',
    ],
    requirements: ['Comfortable with Python', 'Basic understanding of HTTP and databases'],
    modules: [
      {
        title: 'Models and the ORM',
        lessons: ['Modelling relationships', 'Querysets are lazy — and that matters', 'select_related, prefetch_related and N+1'],
      },
      {
        title: 'The API Layer',
        lessons: ['Serializers, validation and nested writes', 'APIView, generics and viewsets compared', 'Routers and URL design'],
      },
      {
        title: 'Access Control',
        lessons: ['Authentication schemes', 'Object-level permissions', 'Throttling and pagination'],
      },
    ],
    quizAt: { module: 0, title: 'ORM and query check', required: true },
  }),

  c({
    title: 'Automate It With Python: Scripts That Save Real Hours',
    subtitle: 'Files, spreadsheets, PDFs, APIs and scheduled jobs',
    categoryName: 'Python',
    level: 'beginner',
    price: 1499,
    tags: ['python', 'automation', 'scripting', 'productivity'],
    thumbnail: 'https://images.unsplash.com/photo-1617042375876-a13e36732a04?w=800&q=80',
    description:
      'The highest-value Python most people write is fifty lines that replace a weekly two-hour chore. This course is a tour of those jobs: renaming and sorting files, reading and writing spreadsheets, pulling tables out of PDFs, calling APIs politely, and scheduling the result so you stop running it by hand.',
    learn: [
      'Manipulate files and directories safely with pathlib',
      'Read and write Excel and CSV data',
      'Extract text and tables from PDFs',
      'Call REST APIs with retries and rate-limit respect',
      'Schedule a script and know when it fails',
    ],
    requirements: ['Basic Python syntax'],
    modules: [
      {
        title: 'Files and Data',
        lessons: ['pathlib and safe file operations', 'Spreadsheets with openpyxl and pandas', 'Pulling data out of PDFs'],
      },
      {
        title: 'The Network',
        lessons: ['Calling APIs with requests', 'Retries, backoff and being a good client'],
      },
      {
        title: 'Running It',
        lessons: ['Scheduling and logging', 'Failing loudly enough to notice'],
      },
    ],
  }),

  /* ── Data Science ──────────────────────────────────────────────────────── */
  c({
    title: 'Statistics for Data Work: Inference You Can Defend',
    subtitle: 'Distributions, uncertainty, and tests that answer the question asked',
    categoryName: 'Data Science',
    level: 'intermediate',
    price: 2599,
    tags: ['statistics', 'inference', 'data-science', 'analysis'],
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
    description:
      'Most statistics teaching starts with the formula and never returns to the question. This course goes the other way: what are you actually claiming, what would have to be true, and how confident can you honestly be. Hypothesis tests, confidence intervals and regression are covered as tools for that argument, including the ways each is routinely abused.',
    learn: [
      'Describe a distribution and say what its summary hides',
      'Build and interpret a confidence interval correctly',
      'Choose a test that matches the question and the data',
      'Read a regression output without over-claiming',
      'Recognise p-hacking and multiple-comparison problems',
    ],
    requirements: ['Comfortable with basic Python or R', 'School-level algebra'],
    modules: [
      {
        title: 'Describing Data',
        lessons: ['Distributions and what a mean hides', 'Variance, and why it matters more than you think', 'Sampling and bias'],
      },
      {
        title: 'Inference',
        lessons: ['Confidence intervals in plain language', 'Hypothesis tests and what a p-value is not', 'Multiple comparisons and p-hacking'],
      },
      {
        title: 'Relationships',
        lessons: ['Linear regression and its assumptions', 'Reading a model output honestly'],
      },
    ],
    quizAt: { module: 1, title: 'Inference check', required: true },
  }),

  c({
    title: 'Data Visualisation That Communicates',
    subtitle: 'Choosing the right chart, and the design rules behind a readable one',
    categoryName: 'Data Science',
    level: 'beginner',
    price: 0,
    tags: ['visualisation', 'charts', 'design', 'data-science'],
    thumbnail: 'https://images.unsplash.com/photo-1543286386-713bdd548da4?w=800&q=80',
    description:
      'A chart is an argument. This course covers how to pick a form that matches the claim, how colour should encode meaning rather than decorate, and the small craft decisions — axis choices, labelling, ordering — that decide whether a reader takes the point or squints. Practical work in matplotlib and a little D3.',
    learn: [
      'Pick a chart type from the job the data has to do',
      'Use colour for identity, magnitude or polarity — and know the difference',
      'Design charts that stay readable for colourblind viewers',
      'Label selectively instead of flooding the plot',
      'Build a dashboard that answers questions rather than listing metrics',
    ],
    requirements: ['Basic Python', 'Some familiarity with pandas helps'],
    modules: [
      {
        title: 'Choosing a Form',
        lessons: ['What is the chart claiming?', 'Comparison, distribution, composition, relationship', 'When a table beats a chart'],
      },
      {
        title: 'Craft',
        lessons: ['Colour as encoding, not decoration', 'Accessible palettes and contrast', 'Labels, axes and the ink you can remove'],
      },
      {
        title: 'Dashboards',
        lessons: ['Layout that leads the reader', 'Interactivity worth adding'],
      },
    ],
    quizAt: { module: 1, title: 'Chart design check' },
  }),

  c({
    title: 'SQL for Analysts: Querying Like You Mean It',
    subtitle: 'Joins, window functions and query plans',
    categoryName: 'Database',
    level: 'beginner',
    price: 0,
    tags: ['sql', 'analytics', 'database', 'queries'],
    thumbnail: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&q=80',
    description:
      'SQL is the highest-leverage skill in data work and the one most people learn by copying. This course builds it properly: what a join really does to row counts, how window functions let you rank and compare without self-joins, and how to read a query plan so you know why something took four minutes.',
    learn: [
      'Write joins knowing what happens to your row count',
      'Aggregate and group without losing detail you needed',
      'Use window functions for ranking, running totals and comparisons',
      'Structure complex logic with CTEs instead of nested subqueries',
      'Read an execution plan and act on it',
    ],
    requirements: ['No SQL experience required'],
    modules: [
      {
        title: 'Getting Data Out',
        lessons: ['SELECT, WHERE and the order of evaluation', 'Joins and what they do to row counts', 'Aggregation and GROUP BY'],
      },
      {
        title: 'Advanced Querying',
        lessons: ['Window functions explained', 'CTEs and readable complexity', 'Sets, unions and anti-joins'],
      },
      {
        title: 'Performance',
        lessons: ['Indexes and when they are used', 'Reading a query plan'],
      },
    ],
    quizAt: { module: 0, title: 'Joins and aggregation check', required: true },
  }),

  c({
    title: 'Apache Spark for Large-Scale Data Processing',
    subtitle: 'DataFrames, shuffles and jobs that finish',
    categoryName: 'Data Science',
    level: 'advanced',
    price: 3799,
    discount: 2799,
    tags: ['spark', 'big-data', 'etl', 'distributed'],
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80',
    description:
      'Spark scales until you write something that makes it shuffle the world. This course covers the execution model — partitions, stages, shuffles — so you can read the Spark UI and see why a job is slow, then works through the join strategies, partitioning choices and file formats that keep large pipelines tractable.',
    learn: [
      'Explain partitions, stages and shuffles',
      'Read the Spark UI to find the real bottleneck',
      'Choose a join strategy for the data sizes involved',
      'Partition and format data for the queries you actually run',
      'Handle skew instead of adding executors',
    ],
    requirements: ['Comfortable with Python or Scala', 'SQL knowledge', 'Some distributed-systems exposure helps'],
    modules: [
      {
        title: 'Execution Model',
        lessons: ['Partitions, tasks and stages', 'Transformations, actions and laziness', 'Reading the Spark UI'],
      },
      {
        title: 'Making It Fast',
        lessons: ['Shuffles and how to avoid them', 'Broadcast versus sort-merge joins', 'Handling data skew'],
      },
      {
        title: 'Storage',
        lessons: ['Parquet, partitioning and predicate pushdown'],
      },
    ],
    quizAt: { module: 0, title: 'Execution model check' },
  }),

  /* ── Artificial Intelligence / ML ──────────────────────────────────────── */
  c({
    title: 'Machine Learning Foundations: Models You Can Explain',
    subtitle: 'Regression, trees, validation and the bias-variance trade-off',
    categoryName: 'Machine Learning',
    level: 'intermediate',
    price: 2999,
    discount: 2199,
    tags: ['machine-learning', 'scikit-learn', 'modelling', 'validation'],
    thumbnail: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800&q=80',
    description:
      'A model that scores well on your test set and fails in production almost always failed at validation, not at modelling. This course spends as much time on evaluation as on algorithms: leakage, cross-validation, class imbalance, and choosing a metric that matches the cost of being wrong. Algorithms are built up from linear regression to gradient boosting.',
    learn: [
      'Frame a problem as a learning task with a defensible metric',
      'Build a validation scheme that does not leak',
      'Understand the bias-variance trade-off concretely',
      'Use linear models, trees and boosting appropriately',
      'Interpret a model well enough to defend its decisions',
    ],
    requirements: ['Python and pandas', 'Basic statistics'],
    modules: [
      {
        title: 'Framing and Validation',
        lessons: ['Turning a question into a learning task', 'Train, validation and test — and leakage', 'Choosing a metric that matches the cost'],
      },
      {
        title: 'Models',
        lessons: ['Linear and logistic regression', 'Decision trees and random forests', 'Gradient boosting in practice'],
      },
      {
        title: 'Trusting the Result',
        lessons: ['Bias, variance and learning curves', 'Feature importance and its limits'],
      },
    ],
    quizAt: { module: 0, title: 'Validation and leakage check', required: true },
  }),

  c({
    title: 'Deep Learning with PyTorch',
    subtitle: 'Tensors, autograd and training loops you wrote yourself',
    categoryName: 'Artificial Intelligence',
    level: 'advanced',
    price: 3999,
    discount: 2999,
    tags: ['pytorch', 'deep-learning', 'neural-networks', 'ai'],
    thumbnail: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&q=80',
    description:
      'Frameworks make it easy to train a network you do not understand. This course builds the training loop by hand first — forward pass, loss, backward pass, optimiser step — so that when something diverges you know which part to look at. Then convolutional and sequence models, transfer learning, and the debugging checklist that saves days.',
    learn: [
      'Work fluently with tensors, shapes and broadcasting',
      'Explain what autograd builds and when it frees it',
      'Write a training loop from scratch and know each line',
      'Build CNN and sequence models for real tasks',
      'Debug a model that will not converge, systematically',
    ],
    requirements: ['Solid Python', 'Linear algebra basics', 'Some machine learning experience'],
    modules: [
      {
        title: 'Mechanics',
        lessons: ['Tensors, shapes and broadcasting', 'Autograd: the graph it builds', 'A training loop, line by line'],
      },
      {
        title: 'Architectures',
        lessons: ['Convolutional networks for images', 'Sequence models and attention', 'Transfer learning that actually transfers'],
      },
      {
        title: 'Getting It To Work',
        lessons: ['A debugging checklist for non-convergence', 'Regularisation and honest evaluation'],
      },
    ],
    quizAt: { module: 0, title: 'Tensors and autograd check', required: true },
  }),

  c({
    title: 'Natural Language Processing with Transformers',
    subtitle: 'Tokenisation, attention, fine-tuning and evaluation',
    categoryName: 'Artificial Intelligence',
    level: 'advanced',
    price: 4299,
    discount: 3199,
    tags: ['nlp', 'transformers', 'ai', 'fine-tuning'],
    thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80',
    description:
      'Transformers are conceptually simple and operationally fiddly. This course covers the architecture honestly — attention as a weighted lookup, positional information, why depth helps — then moves to the practical work: tokenisation surprises, fine-tuning on a modest budget, and evaluating a language model without fooling yourself.',
    learn: [
      'Explain self-attention without hand-waving',
      'Understand what tokenisation does to your data',
      'Fine-tune a pretrained model on a small dataset',
      'Choose evaluation that reflects the task, not the leaderboard',
      'Recognise where a language model should not be used',
    ],
    requirements: ['Deep learning experience', 'Comfortable with PyTorch or TensorFlow'],
    modules: [
      {
        title: 'The Architecture',
        lessons: ['Attention as a weighted lookup', 'Positional information and why it is needed', 'Encoder, decoder and encoder-decoder'],
      },
      {
        title: 'Working With Them',
        lessons: ['Tokenisation and its surprises', 'Fine-tuning on a budget', 'Prompting versus fine-tuning'],
      },
      {
        title: 'Evaluation',
        lessons: ['Metrics that reflect the task', 'Failure modes worth testing for'],
      },
    ],
    quizAt: { module: 0, title: 'Attention mechanics check' },
  }),

  c({
    title: 'Applied AI for Product Teams',
    subtitle: 'Where models help, where they hurt, and how to ship one responsibly',
    categoryName: 'Artificial Intelligence',
    level: 'beginner',
    price: 1899,
    tags: ['ai', 'product', 'strategy', 'ethics'],
    thumbnail: 'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=800&q=80',
    description:
      'Written for product managers, designers and engineers who need to decide whether a model belongs in their product. Covers what current systems are genuinely good at, the failure modes users will hit, how to design interfaces that set correct expectations, and the evaluation and monitoring you need before shipping.',
    learn: [
      'Judge whether a problem is a good fit for a model at all',
      'Design interfaces that communicate uncertainty honestly',
      'Plan evaluation before building',
      'Anticipate failure modes and design for recovery',
      'Work through the privacy and fairness questions early',
    ],
    requirements: ['No technical background required'],
    modules: [
      {
        title: 'Deciding',
        lessons: ['What models are genuinely good at today', 'The cost of being wrong', 'Baselines before models'],
      },
      {
        title: 'Designing',
        lessons: ['Interfaces that set expectations', 'Designing for the failure case', 'Feedback loops that improve the system'],
      },
      {
        title: 'Shipping',
        lessons: ['Evaluation and monitoring', 'Privacy, fairness and accountability'],
      },
    ],
  }),

  c({
    title: 'Computer Vision: From Pixels to Predictions',
    subtitle: 'Classification, detection and segmentation with real datasets',
    categoryName: 'Machine Learning',
    level: 'advanced',
    price: 3699,
    tags: ['computer-vision', 'cnn', 'detection', 'ai'],
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80',
    description:
      'Vision models are unusually sensitive to data handling — augmentation, class balance, and the gap between your curated set and the messy images production sends. This course covers the model families for classification, detection and segmentation, and gives equal weight to the dataset work that decides whether any of them perform.',
    learn: [
      'Build image classifiers that generalise beyond the test set',
      'Understand detection architectures and their trade-offs',
      'Apply segmentation where bounding boxes are not enough',
      'Design augmentation that reflects real-world variation',
      'Evaluate with metrics appropriate to the task',
    ],
    requirements: ['Deep learning fundamentals', 'PyTorch or TensorFlow experience'],
    modules: [
      {
        title: 'Classification',
        lessons: ['CNN architectures worth knowing', 'Augmentation that reflects reality', 'Transfer learning for small datasets'],
      },
      {
        title: 'Detection and Segmentation',
        lessons: ['One-stage versus two-stage detectors', 'Semantic and instance segmentation', 'IoU, mAP and reading the numbers'],
      },
    ],
    quizAt: { module: 0, title: 'Vision fundamentals check' },
  }),

  /* ── Cloud Computing ───────────────────────────────────────────────────── */
  c({
    title: 'AWS Core Services: The Twenty That Matter',
    subtitle: 'Compute, storage, networking and IAM, with the pricing traps',
    categoryName: 'Cloud Computing',
    level: 'beginner',
    price: 2499,
    discount: 1799,
    tags: ['aws', 'cloud', 'iam', 'infrastructure'],
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80',
    description:
      'AWS has hundreds of services and you need about twenty. This course covers those: EC2, S3, VPC, IAM, RDS, Lambda and the supporting cast, with attention to the two things tutorials skip — how the networking actually fits together, and which decisions quietly generate a bill.',
    learn: [
      'Choose between EC2, Lambda and containers for a workload',
      'Design a VPC with sensible subnets and security groups',
      'Write IAM policies that follow least privilege',
      'Pick the right storage class and understand its cost',
      'Estimate and monitor spend before the invoice arrives',
    ],
    requirements: ['Basic networking concepts', 'Command-line comfort'],
    modules: [
      {
        title: 'Compute and Storage',
        lessons: ['EC2, Lambda and containers compared', 'S3, storage classes and lifecycle rules', 'EBS, EFS and picking a disk'],
      },
      {
        title: 'Networking',
        lessons: ['VPCs, subnets and route tables', 'Security groups versus NACLs', 'Load balancing and DNS'],
      },
      {
        title: 'Access and Cost',
        lessons: ['IAM policies and least privilege', 'Where the bill actually comes from'],
      },
    ],
    quizAt: { module: 1, title: 'Networking and IAM check', required: true },
  }),

  c({
    title: 'Terraform: Infrastructure as Code That You Can Review',
    subtitle: 'State, modules, and changes you can predict before applying',
    categoryName: 'DevOps',
    level: 'intermediate',
    price: 2799,
    tags: ['terraform', 'iac', 'devops', 'automation'],
    thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80',
    description:
      'Terraform is only useful if `plan` tells the truth. That depends on understanding state — what it is, where it lives, and how it drifts. This course covers state management first, then module design, then the workflow and review practices that let a team change infrastructure without holding its breath.',
    learn: [
      'Explain what Terraform state is and why it drifts',
      'Read a plan carefully enough to catch a destroy',
      'Write modules that are reusable without being cryptic',
      'Manage multiple environments without duplicating everything',
      'Handle secrets and remote state safely',
    ],
    requirements: ['Familiarity with a cloud provider', 'Command-line comfort'],
    modules: [
      {
        title: 'State',
        lessons: ['What state is and why it exists', 'Remote state and locking', 'Drift, import and refresh'],
      },
      {
        title: 'Structure',
        lessons: ['Modules worth extracting', 'Variables, outputs and interfaces', 'Environments without duplication'],
      },
      {
        title: 'Workflow',
        lessons: ['Reading a plan properly', 'CI for infrastructure changes'],
      },
    ],
    quizAt: { module: 0, title: 'State management check', required: true },
  }),

  c({
    title: 'Serverless Architecture Patterns',
    subtitle: 'Functions, queues, events and the trade-offs nobody mentions',
    categoryName: 'Cloud Computing',
    level: 'intermediate',
    price: 2699,
    tags: ['serverless', 'lambda', 'event-driven', 'cloud'],
    thumbnail: 'https://images.unsplash.com/photo-1484557052118-f32bd25b45b5?w=800&q=80',
    description:
      'Serverless removes server management and adds distributed-systems problems. This course covers the patterns that work — event-driven pipelines, queue-backed workers, fan-out — alongside the realities: cold starts, execution limits, local testing difficulty, and the observability you need when there is no host to log into.',
    learn: [
      'Decompose a workload into functions sensibly',
      'Design event-driven pipelines with queues and topics',
      'Handle retries, idempotency and dead letters',
      'Mitigate cold starts where they actually matter',
      'Trace a request across a dozen functions',
    ],
    requirements: ['Cloud fundamentals', 'Experience with an application language'],
    modules: [
      {
        title: 'Patterns',
        lessons: ['Function granularity and when to split', 'Queues, topics and fan-out', 'Idempotency and retries'],
      },
      {
        title: 'Realities',
        lessons: ['Cold starts: when they matter', 'Limits, timeouts and payload sizes', 'Observability without a server'],
      },
    ],
    quizAt: { module: 0, title: 'Event patterns check' },
  }),

  c({
    title: 'Azure Fundamentals for Developers',
    subtitle: 'App Service, Functions, storage and identity',
    categoryName: 'Cloud Computing',
    level: 'beginner',
    price: 0,
    tags: ['azure', 'cloud', 'app-service', 'identity'],
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80',
    description:
      'A developer-focused tour of Azure: deploying an application to App Service, adding background work with Functions, choosing between the storage options, and wiring up identity with Entra ID. Focused on what you need to ship something rather than on certification trivia.',
    learn: [
      'Deploy and configure an application on App Service',
      'Add background processing with Functions',
      'Choose between Blob, Table, Queue and Cosmos DB',
      'Integrate authentication with Entra ID',
      'Use resource groups and role assignments sensibly',
    ],
    requirements: ['Some application development experience'],
    modules: [
      {
        title: 'Hosting',
        lessons: ['App Service and deployment slots', 'Configuration and secrets', 'Scaling rules that make sense'],
      },
      {
        title: 'Data and Identity',
        lessons: ['Choosing a storage service', 'Entra ID and app registration'],
      },
    ],
  }),

  /* ── DevOps ────────────────────────────────────────────────────────────── */
  c({
    title: 'CI/CD Pipelines: From Commit to Production Safely',
    subtitle: 'Build, test, deploy and roll back without ceremony',
    categoryName: 'DevOps',
    level: 'intermediate',
    price: 2399,
    tags: ['ci-cd', 'devops', 'automation', 'deployment'],
    thumbnail: 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=800&q=80',
    description:
      'A pipeline is worth having only if the team trusts it. That means fast feedback, reliable tests, and a rollback that works under pressure. This course builds a pipeline stage by stage, covers the deployment strategies and when each fits, and is candid about the flaky-test problem that undermines most CI setups.',
    learn: [
      'Design pipeline stages that fail fast on the cheapest check',
      'Keep a test suite trustworthy rather than merely green',
      'Choose between blue-green, canary and rolling deploys',
      'Build a rollback you have actually practised',
      'Manage secrets and artefacts through the pipeline',
    ],
    requirements: ['Git familiarity', 'Some deployment experience'],
    modules: [
      {
        title: 'Building',
        lessons: ['Stages, caching and fast feedback', 'Artefacts and reproducible builds', 'The flaky test problem'],
      },
      {
        title: 'Deploying',
        lessons: ['Blue-green, canary and rolling compared', 'Database migrations in a pipeline', 'Rollback you have rehearsed'],
      },
    ],
    quizAt: { module: 1, title: 'Deployment strategy check' },
  }),

  c({
    title: 'Observability: Logs, Metrics and Traces in Practice',
    subtitle: 'Knowing what your system is doing before a user tells you',
    categoryName: 'DevOps',
    level: 'intermediate',
    price: 2599,
    tags: ['observability', 'monitoring', 'tracing', 'sre'],
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
    description:
      'Monitoring tells you a known thing broke. Observability lets you ask a question you had not thought of. This course covers the three signals and what each is genuinely good for, how to instrument without drowning in cardinality or cost, and how to write alerts that people act on instead of muting.',
    learn: [
      'Choose between a log, a metric and a span for a given question',
      'Instrument a service with OpenTelemetry',
      'Control cardinality and cost',
      'Define SLOs and alert on burn rate',
      'Run an incident with the data in front of you',
    ],
    requirements: ['Experience running a service in production'],
    modules: [
      {
        title: 'The Signals',
        lessons: ['Logs, metrics and traces compared', 'Structured logging that is actually queryable', 'Distributed tracing and context propagation'],
      },
      {
        title: 'Making It Useful',
        lessons: ['Cardinality, sampling and cost', 'SLOs and error budgets', 'Alerts people do not mute'],
      },
    ],
    quizAt: { module: 0, title: 'Signals check' },
  }),

  c({
    title: 'Linux for Developers: The Command Line You Actually Need',
    subtitle: 'Processes, permissions, networking and shell that composes',
    categoryName: 'DevOps',
    level: 'beginner',
    price: 0,
    tags: ['linux', 'bash', 'command-line', 'sysadmin'],
    thumbnail: 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=800&q=80',
    description:
      'Everything you deploy runs on Linux, and the moments you need it most are the stressful ones. This course covers the mental model — processes, file descriptors, permissions, signals — and the toolset that composes, so diagnosing a stuck service becomes methodical rather than a search-engine session.',
    learn: [
      'Navigate, inspect and manipulate a filesystem confidently',
      'Understand processes, signals and job control',
      'Read and set permissions and ownership correctly',
      'Compose pipelines with grep, awk, sed and find',
      'Diagnose a service that is not responding',
    ],
    requirements: ['No Linux experience needed'],
    modules: [
      {
        title: 'The Basics',
        lessons: ['Filesystem, paths and navigation', 'Permissions and ownership', 'Processes, signals and jobs'],
      },
      {
        title: 'Composing Tools',
        lessons: ['Pipes, redirection and file descriptors', 'grep, sed, awk and find in anger', 'Writing a shell script worth keeping'],
      },
      {
        title: 'Diagnosing',
        lessons: ['Networking tools and open ports', 'When a service will not start'],
      },
    ],
    quizAt: { module: 0, title: 'Processes and permissions check' },
  }),

  c({
    title: 'Docker in Depth: Images, Networks and Compose',
    subtitle: 'Containers that are small, reproducible and debuggable',
    categoryName: 'DevOps',
    level: 'beginner',
    price: 1699,
    tags: ['docker', 'containers', 'devops', 'compose'],
    thumbnail: 'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=800&q=80',
    description:
      'A Dockerfile that works is easy. One that builds in ten seconds, ships forty megabytes and behaves identically on a colleague\'s laptop takes understanding. This course covers the layer model, multi-stage builds, networking and volumes, and the debugging techniques for when a container exits with no useful message.',
    learn: [
      'Write Dockerfiles that use the layer cache properly',
      'Cut image size with multi-stage builds',
      'Understand container networking and port publishing',
      'Persist data with volumes and bind mounts correctly',
      'Debug a container that exits immediately',
    ],
    requirements: ['Command-line comfort'],
    modules: [
      {
        title: 'Images',
        lessons: ['Layers and the build cache', 'Multi-stage builds', 'Base images and what they cost you'],
      },
      {
        title: 'Running Containers',
        lessons: ['Networking and published ports', 'Volumes, bind mounts and data', 'Compose for multi-service development'],
      },
      {
        title: 'Debugging',
        lessons: ['When a container exits immediately'],
      },
    ],
    quizAt: { module: 0, title: 'Image layers check' },
  }),

  /* ── Cybersecurity ─────────────────────────────────────────────────────── */
  c({
    title: 'Web Application Security: The OWASP Top 10 in Real Code',
    subtitle: 'Finding and fixing the vulnerabilities that actually get exploited',
    categoryName: 'Cybersecurity',
    level: 'intermediate',
    price: 2999,
    discount: 2199,
    tags: ['security', 'owasp', 'appsec', 'web'],
    thumbnail: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80',
    description:
      'Each item in the OWASP Top 10 is shown as it appears in ordinary application code — not as an abstract category — then exploited in a lab and fixed properly. Emphasis on the defences that remove a whole class of bug rather than patching one instance, and on the access-control failures that top the list year after year.',
    learn: [
      'Recognise injection, broken access control and misconfiguration in real code',
      'Exploit each vulnerability in a lab so the risk is concrete',
      'Apply fixes that eliminate the class, not the instance',
      'Threat model a feature before it is built',
      'Review a pull request with security in mind',
    ],
    requirements: ['Experience building web applications', 'Basic HTTP knowledge'],
    modules: [
      {
        title: 'Access Control and Injection',
        lessons: ['Broken access control: the number one for a reason', 'SQL and NoSQL injection', 'Cross-site scripting and output encoding'],
      },
      {
        title: 'Configuration and Design',
        lessons: ['Security misconfiguration', 'Insecure design and threat modelling', 'Dependencies and the supply chain'],
      },
      {
        title: 'Practice',
        lessons: ['Reviewing code for security', 'Secure defaults that make misuse awkward'],
      },
    ],
    quizAt: { module: 0, title: 'OWASP fundamentals check', required: true },
  }),

  c({
    title: 'Cryptography for Developers',
    subtitle: 'Using primitives correctly without inventing your own',
    categoryName: 'Cybersecurity',
    level: 'intermediate',
    price: 2499,
    tags: ['cryptography', 'security', 'tls', 'hashing'],
    thumbnail: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=800&q=80',
    description:
      'You will almost never implement a cipher; you will constantly choose and combine primitives, and that is where things break. This course covers hashing, symmetric and asymmetric encryption, signatures and key exchange at the level a developer needs: what each guarantees, what it does not, and the misuse patterns that quietly void the guarantee.',
    learn: [
      'Distinguish hashing, encryption and encoding properly',
      'Store passwords correctly and know why bcrypt is slow',
      'Choose an appropriate symmetric mode and handle nonces',
      'Understand public-key exchange and signatures',
      'Read a TLS handshake and know what it proves',
    ],
    requirements: ['Programming experience', 'No mathematics background required'],
    modules: [
      {
        title: 'Primitives',
        lessons: ['Hashing, encryption and encoding are different things', 'Password storage done right', 'Symmetric encryption and nonce discipline'],
      },
      {
        title: 'Public Key',
        lessons: ['Key exchange and forward secrecy', 'Signatures and certificates', 'What a TLS handshake proves'],
      },
    ],
    quizAt: { module: 0, title: 'Primitives check', required: true },
  }),

  c({
    title: 'Network Security and Defensive Monitoring',
    subtitle: 'Segmentation, firewalls and spotting the traffic that should not be there',
    categoryName: 'Cybersecurity',
    level: 'advanced',
    price: 3499,
    tags: ['network-security', 'monitoring', 'defence', 'blue-team'],
    thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80',
    description:
      'A defensive course: how networks are segmented, what firewall and IDS rules can and cannot see, and how to build monitoring that surfaces anomalous traffic without burying the analyst. Includes packet analysis, log correlation, and structuring an incident response that does not depend on one person remembering everything.',
    learn: [
      'Design network segmentation that limits blast radius',
      'Write firewall and detection rules that hold up',
      'Analyse captured traffic to confirm or rule out a theory',
      'Correlate logs across systems during an investigation',
      'Run an incident response with a repeatable process',
    ],
    requirements: ['Solid networking fundamentals', 'Linux command-line comfort'],
    modules: [
      {
        title: 'Architecture',
        lessons: ['Segmentation and blast radius', 'Firewalls, proxies and what each sees', 'Zero-trust in practical terms'],
      },
      {
        title: 'Detection',
        lessons: ['Packet analysis fundamentals', 'IDS rules and tuning out the noise', 'Log correlation across systems'],
      },
      {
        title: 'Response',
        lessons: ['A repeatable incident process'],
      },
    ],
    quizAt: { module: 1, title: 'Detection check' },
  }),

  /* ── Database ──────────────────────────────────────────────────────────── */
  c({
    title: 'PostgreSQL for Application Developers',
    subtitle: 'Indexes, transactions, JSON and the features you are not using',
    categoryName: 'Database',
    level: 'intermediate',
    price: 2599,
    tags: ['postgresql', 'sql', 'database', 'performance'],
    thumbnail: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&q=80',
    description:
      'Most applications use Postgres as a dumb table store and then add a cache, a queue and a search index to work around problems Postgres already solves. This course covers indexing properly, transaction isolation and the anomalies each level permits, JSONB, full-text search, and the locking behaviour behind your mysterious production stall.',
    learn: [
      'Choose and verify indexes using EXPLAIN ANALYZE',
      'Pick an isolation level knowing which anomalies it allows',
      'Use JSONB without giving up query performance',
      'Implement full-text search in the database',
      'Diagnose lock contention and long-running transactions',
    ],
    requirements: ['Working SQL knowledge', 'Some application development experience'],
    modules: [
      {
        title: 'Performance',
        lessons: ['Index types and when each is used', 'Reading EXPLAIN ANALYZE', 'Statistics, planning and bad estimates'],
      },
      {
        title: 'Correctness',
        lessons: ['Transactions and isolation levels', 'Locks and contention', 'Constraints as the last line of defence'],
      },
      {
        title: 'Beyond Tables',
        lessons: ['JSONB and hybrid modelling', 'Full-text search in Postgres'],
      },
    ],
    quizAt: { module: 1, title: 'Transactions and isolation check', required: true },
  }),

  c({
    title: 'MongoDB Data Modelling and Aggregation',
    subtitle: 'Schema design for the queries you will actually run',
    categoryName: 'Database',
    level: 'intermediate',
    price: 2299,
    tags: ['mongodb', 'nosql', 'aggregation', 'schema-design'],
    thumbnail: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&q=80',
    description:
      'Schema-less does not mean schema-free; it means the schema is your responsibility. This course covers the embed-versus-reference decision with the trade-offs made explicit, then the aggregation pipeline stage by stage, indexing strategy, and the scaling considerations that decide your shard key long before you need one.',
    learn: [
      'Decide between embedding and referencing from access patterns',
      'Avoid unbounded arrays and the document size limit',
      'Write aggregation pipelines that stay readable',
      'Design compound indexes that match your queries',
      'Understand replication and choose a shard key sensibly',
    ],
    requirements: ['Basic database concepts', 'Some application development experience'],
    modules: [
      {
        title: 'Modelling',
        lessons: ['Embed or reference: the real trade-off', 'Unbounded growth and the 16MB limit', 'Denormalisation and keeping it in sync'],
      },
      {
        title: 'Querying',
        lessons: ['The aggregation pipeline stage by stage', 'Indexes and the ESR rule', 'Explain output and covered queries'],
      },
      {
        title: 'Scaling',
        lessons: ['Replica sets and read preference', 'Choosing a shard key you will not regret'],
      },
    ],
    quizAt: { module: 0, title: 'Schema design check', required: true },
  }),

  c({
    title: 'Redis: Caching, Queues and Data Structures',
    subtitle: 'The right patterns, and the cache invalidation problem',
    categoryName: 'Database',
    level: 'intermediate',
    price: 1899,
    tags: ['redis', 'caching', 'queues', 'performance'],
    thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80',
    description:
      'Redis is a data structure server that most teams use as a key-value cache and little else. This course covers the structures that make it genuinely powerful — sorted sets, streams, hyperloglogs — and treats caching seriously: invalidation strategies, stampede protection, and being explicit about staleness you can tolerate.',
    learn: [
      'Use the right Redis structure for the job',
      'Design a caching layer with an explicit staleness budget',
      'Prevent cache stampedes and thundering herds',
      'Build reliable queues and rate limiters',
      'Understand persistence options and what you can lose',
    ],
    requirements: ['Backend development experience'],
    modules: [
      {
        title: 'Structures',
        lessons: ['Strings, hashes, lists, sets', 'Sorted sets and leaderboards', 'Streams for event data'],
      },
      {
        title: 'Caching',
        lessons: ['Invalidation strategies and their costs', 'Stampede protection', 'What staleness can you tolerate?'],
      },
      {
        title: 'Operations',
        lessons: ['Persistence, and what you can lose', 'Eviction policies'],
      },
    ],
    quizAt: { module: 1, title: 'Caching strategy check' },
  }),

  /* ── UI/UX Design ──────────────────────────────────────────────────────── */
  c({
    title: 'Design Systems: Building a Component Library That Lasts',
    subtitle: 'Tokens, components, documentation and the governance that keeps it used',
    categoryName: 'UI/UX Design',
    level: 'intermediate',
    price: 2799,
    discount: 1999,
    tags: ['design-systems', 'figma', 'components', 'tokens'],
    thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80',
    description:
      'Most design systems are abandoned not because the components were wrong but because nobody maintained the contract between design and engineering. This course covers token architecture, component API design, documentation that people read, and the governance model that decides who can add a variant and why.',
    learn: [
      'Structure tokens so a rebrand is a config change',
      'Design component APIs that resist one-off variants',
      'Keep Figma and code in genuine sync',
      'Write documentation people use instead of guessing',
      'Set up governance and a contribution path',
    ],
    requirements: ['Design or frontend experience', 'Familiarity with Figma or a component framework'],
    modules: [
      {
        title: 'Foundations',
        lessons: ['Token architecture: primitive, semantic, component', 'Typography and spacing scales', 'Colour systems and theming'],
      },
      {
        title: 'Components',
        lessons: ['Designing a component API', 'Variants versus new components', 'Accessibility built in, not added'],
      },
      {
        title: 'Keeping It Alive',
        lessons: ['Documentation that gets read', 'Governance and contribution'],
      },
    ],
    quizAt: { module: 0, title: 'Token architecture check' },
  }),

  c({
    title: 'User Research: Finding Out What People Actually Do',
    subtitle: 'Interviews, usability testing and analysis without leading the witness',
    categoryName: 'UI/UX Design',
    level: 'beginner',
    price: 1899,
    tags: ['user-research', 'ux', 'interviews', 'usability'],
    thumbnail: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80',
    description:
      'Research goes wrong at the question. Ask people what they want and they will invent an answer; ask what they did last time and you learn something. This course covers interview technique, usability test design, and the analysis step most teams skip — turning transcripts into findings a team will actually act on.',
    learn: [
      'Write interview questions that do not lead',
      'Run a usability test that produces findings, not opinions',
      'Recruit participants who represent your users',
      'Analyse qualitative data systematically',
      'Present findings so they change a decision',
    ],
    requirements: ['No research background required'],
    modules: [
      {
        title: 'Asking',
        lessons: ['Why "what do you want" fails', 'Interview technique and silence', 'Recruiting the right participants'],
      },
      {
        title: 'Observing',
        lessons: ['Designing usability tasks', 'Running a session without helping', 'Remote and unmoderated testing'],
      },
      {
        title: 'Acting',
        lessons: ['From transcripts to findings', 'Presenting research that changes decisions'],
      },
    ],
  }),

  c({
    title: 'Figma for Product Designers',
    subtitle: 'Auto layout, components, variables and prototypes that communicate',
    categoryName: 'UI/UX Design',
    level: 'beginner',
    price: 0,
    tags: ['figma', 'design', 'prototyping', 'ui'],
    thumbnail: 'https://images.unsplash.com/photo-1541462608143-67571c6738dd?w=800&q=80',
    description:
      'Figma rewards structure. This course covers auto layout until it stops fighting you, component and variant architecture, variables for theming, and prototyping that communicates intent to engineers rather than producing a demo that falls apart under questioning.',
    learn: [
      'Use auto layout to build genuinely responsive frames',
      'Structure components, variants and properties',
      'Apply variables for theming and modes',
      'Build prototypes that answer engineering questions',
      'Hand off work that does not need a meeting to interpret',
    ],
    requirements: ['A free Figma account'],
    modules: [
      {
        title: 'Building Blocks',
        lessons: ['Auto layout properly', 'Constraints and responsive frames', 'Styles and variables'],
      },
      {
        title: 'Systems',
        lessons: ['Components, variants and properties', 'Libraries and publishing'],
      },
      {
        title: 'Communicating',
        lessons: ['Prototyping with intent', 'Handoff that answers questions in advance'],
      },
    ],
  }),

  c({
    title: 'Accessibility Engineering: WCAG in Practice',
    subtitle: 'Building interfaces that work for everyone, verified not assumed',
    categoryName: 'UI/UX Design',
    level: 'intermediate',
    price: 2199,
    tags: ['accessibility', 'wcag', 'aria', 'inclusive-design'],
    thumbnail: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=800&q=80',
    description:
      'Accessibility overlays and automated scanners catch perhaps a third of real problems. This course covers the rest: keyboard operation, focus management, the accessibility tree, ARIA used correctly and — more often — avoided, and actually testing with a screen reader rather than assuming.',
    learn: [
      'Make every interaction reachable and operable by keyboard',
      'Manage focus through modals, menus and route changes',
      'Use ARIA correctly, and know when native HTML is better',
      'Meet contrast and target-size requirements deliberately',
      'Test with a screen reader as part of normal work',
    ],
    requirements: ['Frontend development experience'],
    modules: [
      {
        title: 'Foundations',
        lessons: ['The accessibility tree', 'Keyboard operability end to end', 'Focus management that does not trap'],
      },
      {
        title: 'ARIA and Patterns',
        lessons: ['ARIA rules, including the first one', 'Accessible modals, menus and tabs', 'Forms, errors and announcements'],
      },
      {
        title: 'Verifying',
        lessons: ['Screen reader testing basics', 'What automated tools miss'],
      },
    ],
    quizAt: { module: 1, title: 'ARIA and patterns check', required: true },
  }),

  /* ── Mobile Development ────────────────────────────────────────────────── */
  c({
    title: 'React Native: One Codebase, Two Real Apps',
    subtitle: 'Navigation, native modules and performance on actual devices',
    categoryName: 'Mobile Development',
    level: 'intermediate',
    price: 3199,
    discount: 2299,
    tags: ['react-native', 'mobile', 'ios', 'android'],
    thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80',
    description:
      'React Native is genuinely cross-platform until you hit the parts that are not. This course covers the architecture, navigation, and the performance work specific to mobile — list virtualisation, bridge traffic, animation on the UI thread — plus how to drop into native code when a library does not exist.',
    learn: [
      'Structure navigation for a real app, not a demo',
      'Build lists that stay smooth with thousands of rows',
      'Animate on the UI thread rather than through the bridge',
      'Bridge to native code when you need to',
      'Build, sign and ship to both stores',
    ],
    requirements: ['Solid React', 'Some mobile platform familiarity helps'],
    modules: [
      {
        title: 'Structure',
        lessons: ['Navigation patterns that scale', 'Platform differences worth handling', 'State and data fetching on mobile'],
      },
      {
        title: 'Performance',
        lessons: ['List virtualisation done right', 'Animations on the UI thread', 'Profiling on a real device'],
      },
      {
        title: 'Shipping',
        lessons: ['Native modules when you need them', 'Building and signing releases'],
      },
    ],
    quizAt: { module: 1, title: 'Mobile performance check' },
  }),

  c({
    title: 'iOS Development with Swift and SwiftUI',
    subtitle: 'Declarative interfaces, state and the Apple platform conventions',
    categoryName: 'Mobile Development',
    level: 'intermediate',
    price: 3399,
    tags: ['swift', 'swiftui', 'ios', 'mobile'],
    thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80',
    description:
      'SwiftUI is a pleasure once its state model clicks and a mystery before that. This course covers Swift essentials, then the property wrappers in detail — what @State, @Binding, @Observable and @Environment each own — followed by navigation, data persistence and the platform conventions that make an app feel native.',
    learn: [
      'Write idiomatic Swift with optionals and value types',
      'Choose the correct property wrapper for each piece of state',
      'Compose views and manage layout in SwiftUI',
      'Persist data with SwiftData or Core Data',
      'Follow the platform conventions users expect',
    ],
    requirements: ['A Mac with Xcode', 'Programming experience in any language'],
    modules: [
      {
        title: 'Swift',
        lessons: ['Value types, optionals and error handling', 'Protocols and generics'],
      },
      {
        title: 'SwiftUI',
        lessons: ['Views, modifiers and layout', 'State, Binding, Observable, Environment', 'Navigation and presentation'],
      },
      {
        title: 'Data',
        lessons: ['Persistence with SwiftData', 'Networking and async/await'],
      },
    ],
    quizAt: { module: 1, title: 'SwiftUI state check', required: true },
  }),

  c({
    title: 'Android Development with Kotlin and Jetpack Compose',
    subtitle: 'Composables, state hoisting and the modern Android stack',
    categoryName: 'Mobile Development',
    level: 'intermediate',
    price: 3299,
    tags: ['kotlin', 'android', 'jetpack-compose', 'mobile'],
    thumbnail: 'https://images.unsplash.com/photo-1607252650355-f7fd0460ccdb?w=800&q=80',
    description:
      'Compose replaced a decade of XML layouts and view binding with a model that is simpler once you accept recomposition. This course covers Kotlin for Android, composable design and state hoisting, the recomposition rules that decide your frame rate, and the Jetpack libraries that handle navigation, persistence and background work.',
    learn: [
      'Write Kotlin comfortably, including coroutines and flows',
      'Build composables and hoist state correctly',
      'Understand recomposition and avoid needless work',
      'Use Room, Navigation and WorkManager appropriately',
      'Handle the Android lifecycle without leaking',
    ],
    requirements: ['Programming experience', 'Android Studio installed'],
    modules: [
      {
        title: 'Kotlin',
        lessons: ['Kotlin essentials for Android', 'Coroutines and flows'],
      },
      {
        title: 'Compose',
        lessons: ['Composables and modifiers', 'State hoisting and unidirectional data flow', 'Recomposition and performance'],
      },
      {
        title: 'The Stack',
        lessons: ['Navigation and architecture', 'Room and background work'],
      },
    ],
    quizAt: { module: 1, title: 'Compose state check' },
  }),

  c({
    title: 'Mobile App Design: Patterns That Feel Native',
    subtitle: 'Touch targets, navigation models and platform conventions',
    categoryName: 'UI/UX Design',
    level: 'beginner',
    price: 1699,
    tags: ['mobile-design', 'ux', 'ios', 'android'],
    thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80',
    description:
      'An app that ignores platform conventions feels wrong before a user can say why. This course covers the navigation models on each platform, touch target and thumb-reach realities, gestures that are discoverable, and designing for interruption — the defining condition of mobile use.',
    learn: [
      'Choose a navigation model that fits the content',
      'Size and place targets for real thumbs',
      'Use gestures without hiding essential actions',
      'Design for interruption and re-entry',
      'Respect iOS and Android conventions where they differ',
    ],
    requirements: ['Some design familiarity helps but is not required'],
    modules: [
      {
        title: 'Structure',
        lessons: ['Tabs, stacks and drawers', 'Information density on a small screen'],
      },
      {
        title: 'Interaction',
        lessons: ['Touch targets and thumb reach', 'Gestures that stay discoverable', 'Designing for interruption'],
      },
    ],
  }),

  /* ── Java / enterprise ─────────────────────────────────────────────────── */
  c({
    title: 'Java Fundamentals for Modern Development',
    subtitle: 'The language as it is today, not as it was in 2005',
    categoryName: 'Java',
    level: 'beginner',
    price: 0,
    tags: ['java', 'oop', 'programming', 'jvm'],
    thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80',
    description:
      'Java has changed considerably and most teaching has not kept up. This course covers the modern language: records, sealed types, pattern matching, streams and the var keyword, alongside the object-oriented foundations. Written for people who want to write current Java rather than translate C++ into it.',
    learn: [
      'Use records, sealed types and pattern matching',
      'Work with collections and streams idiomatically',
      'Handle exceptions and resources correctly',
      'Design classes and interfaces with clear responsibilities',
      'Understand the basics of JVM memory and garbage collection',
    ],
    requirements: ['No Java experience required', 'Some programming background helps'],
    modules: [
      {
        title: 'The Language',
        lessons: ['Types, var and immutability', 'Classes, records and sealed types', 'Interfaces and polymorphism'],
      },
      {
        title: 'Working With Data',
        lessons: ['Collections and when to use each', 'Streams and the pipeline model', 'Optional, and using it properly'],
      },
      {
        title: 'The Runtime',
        lessons: ['Exceptions and try-with-resources', 'JVM memory and garbage collection basics'],
      },
    ],
    quizAt: { module: 1, title: 'Collections and streams check' },
  }),

  c({
    title: 'Spring Boot: Building Production Services',
    subtitle: 'Dependency injection, data access, security and observability',
    categoryName: 'Java',
    level: 'intermediate',
    price: 3199,
    discount: 2399,
    tags: ['spring-boot', 'java', 'microservices', 'backend'],
    thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&q=80',
    description:
      'Spring Boot does an enormous amount automatically, which is wonderful until you need to know what it did. This course makes the auto-configuration legible, covers data access with JPA including the query problems it hides, then security, testing and the observability you need to run the service you built.',
    learn: [
      'Understand dependency injection and what auto-configuration wired up',
      'Use JPA without generating a query per row',
      'Secure endpoints with Spring Security properly',
      'Write tests at the right level, fast',
      'Add metrics, health checks and tracing',
    ],
    requirements: ['Comfortable with Java', 'Basic HTTP and SQL knowledge'],
    modules: [
      {
        title: 'The Framework',
        lessons: ['Dependency injection and the context', 'Auto-configuration made visible', 'Configuration and profiles'],
      },
      {
        title: 'Data',
        lessons: ['JPA entities and relationships', 'The N+1 problem in Spring Data', 'Transactions and propagation'],
      },
      {
        title: 'Production',
        lessons: ['Spring Security fundamentals', 'Testing at the right level', 'Actuator, metrics and health'],
      },
    ],
    quizAt: { module: 1, title: 'JPA and transactions check', required: true },
  }),

  c({
    title: 'Microservices: Boundaries, Contracts and Failure',
    subtitle: 'When to split a system, and what it costs when you do',
    categoryName: 'Business/Technology',
    level: 'advanced',
    price: 3599,
    tags: ['microservices', 'architecture', 'distributed-systems', 'design'],
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80',
    description:
      'Splitting a monolith converts function calls into network calls, and every network call can fail, retry and arrive twice. This course is honest about that trade: it covers how to find genuine service boundaries, how to version contracts, how to handle distributed data without two-phase commit fantasies, and when the answer is to keep the monolith.',
    learn: [
      'Find service boundaries from the domain, not the org chart',
      'Version APIs and evolve contracts without breaking consumers',
      'Handle distributed data with sagas and eventual consistency',
      'Design for partial failure with timeouts and circuit breakers',
      'Recognise when a monolith is the correct answer',
    ],
    requirements: ['Experience building and running backend systems'],
    modules: [
      {
        title: 'Boundaries',
        lessons: ['Finding a boundary in the domain', 'The costs you take on when you split', 'When not to split'],
      },
      {
        title: 'Contracts',
        lessons: ['API versioning and evolution', 'Synchronous versus event-driven communication'],
      },
      {
        title: 'Failure',
        lessons: ['Timeouts, retries and circuit breakers', 'Sagas and eventual consistency', 'Distributed tracing when it breaks'],
      },
    ],
    quizAt: { module: 2, title: 'Failure handling check', required: true },
  }),

  /* ── Node.js / backend ─────────────────────────────────────────────────── */
  c({
    title: 'Node.js Internals: Event Loop, Streams and Performance',
    subtitle: 'What is actually happening while your handler waits',
    categoryName: 'Node.js',
    level: 'advanced',
    price: 2999,
    tags: ['nodejs', 'streams', 'performance', 'event-loop'],
    thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&q=80',
    description:
      'Node is single-threaded in the way that matters and not in the way people assume. This course covers the event loop phases, the thread pool, streams and backpressure, and the profiling workflow for finding what blocked the loop — the difference between a service that handles load and one that falls over at a hundred concurrent requests.',
    learn: [
      'Describe the event loop phases and what runs in each',
      'Know what uses the thread pool and what does not',
      'Use streams and respect backpressure',
      'Profile CPU and memory to find the real problem',
      'Scale with clustering and worker threads appropriately',
    ],
    requirements: ['Solid JavaScript and Node experience'],
    modules: [
      {
        title: 'The Loop',
        lessons: ['Event loop phases in detail', 'The thread pool and what uses it', 'Blocking: how to spot it'],
      },
      {
        title: 'Streams',
        lessons: ['Readable, writable, transform', 'Backpressure and why it exists'],
      },
      {
        title: 'Scaling',
        lessons: ['Profiling CPU and heap', 'Clustering and worker threads'],
      },
    ],
    quizAt: { module: 0, title: 'Event loop check', required: true },
  }),

  c({
    title: 'GraphQL APIs: Schema Design and the N+1 Problem',
    subtitle: 'Resolvers, dataloaders and knowing when REST was fine',
    categoryName: 'Node.js',
    level: 'intermediate',
    price: 2599,
    tags: ['graphql', 'api', 'schema', 'backend'],
    thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80',
    description:
      'GraphQL solves over-fetching and hands you a performance problem in return: a nested query can trigger hundreds of database round trips. This course covers schema design, resolver architecture, dataloader batching, and authorisation — which is materially harder when the client chooses the shape of the response.',
    learn: [
      'Design a schema around the domain rather than your tables',
      'Structure resolvers and avoid N+1 with dataloaders',
      'Implement field-level authorisation',
      'Handle errors and partial responses sensibly',
      'Judge honestly whether GraphQL is worth it for your case',
    ],
    requirements: ['Backend development experience', 'Familiarity with REST APIs'],
    modules: [
      {
        title: 'Schema',
        lessons: ['Designing types around the domain', 'Queries, mutations and subscriptions', 'Pagination that works'],
      },
      {
        title: 'Resolvers',
        lessons: ['Resolver execution and the N+1 trap', 'Dataloader batching', 'Field-level authorisation'],
      },
      {
        title: 'Judgement',
        lessons: ['Caching in a GraphQL world', 'When REST was the right answer'],
      },
    ],
    quizAt: { module: 1, title: 'Resolvers and N+1 check', required: true },
  }),

  c({
    title: 'WebSockets and Real-Time Applications',
    subtitle: 'Live updates, presence and reconnection that actually works',
    categoryName: 'Node.js',
    level: 'intermediate',
    price: 2399,
    tags: ['websockets', 'real-time', 'nodejs', 'socket-io'],
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80',
    description:
      'Real-time features are easy to demo and hard to keep working — connections drop, users open five tabs, and a server restart disconnects everyone at once. This course covers the protocol, the patterns for presence and rooms, reconnection with state recovery, and scaling across multiple server instances.',
    learn: [
      'Understand the WebSocket handshake and protocol',
      'Build presence and room-based broadcasting',
      'Handle reconnection and recover missed messages',
      'Scale across instances with a pub/sub backplane',
      'Choose between WebSockets, SSE and polling honestly',
    ],
    requirements: ['Node.js experience', 'Understanding of HTTP'],
    modules: [
      {
        title: 'The Protocol',
        lessons: ['Handshake, frames and the lifecycle', 'WebSockets, SSE and polling compared'],
      },
      {
        title: 'Patterns',
        lessons: ['Rooms, channels and broadcasting', 'Presence that stays accurate', 'Reconnection and missed messages'],
      },
      {
        title: 'Scale',
        lessons: ['Pub/sub across instances', 'Load balancing sticky connections'],
      },
    ],
    quizAt: { module: 0, title: 'Protocol check' },
  }),

  c({
    title: 'API Design: Interfaces Developers Enjoy Using',
    subtitle: 'Resources, versioning, errors and documentation',
    categoryName: 'Business/Technology',
    level: 'intermediate',
    price: 1999,
    tags: ['api-design', 'rest', 'documentation', 'architecture'],
    thumbnail: 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=800&q=80',
    description:
      'An API is a contract you will live with for years. This course covers resource modelling, the status codes people get wrong, error bodies a client can act on, pagination and filtering, versioning strategies, and documentation that answers the question before it is asked. Framework-agnostic.',
    learn: [
      'Model resources and relationships coherently',
      'Use HTTP status codes and methods correctly',
      'Design error responses clients can act on programmatically',
      'Implement pagination, filtering and sorting consistently',
      'Version an API without stranding consumers',
    ],
    requirements: ['Some experience building or consuming APIs'],
    modules: [
      {
        title: 'The Interface',
        lessons: ['Resource modelling and naming', 'Methods, status codes and semantics', 'Consistency as a feature'],
      },
      {
        title: 'The Details',
        lessons: ['Error responses that help', 'Pagination, filtering and sorting', 'Idempotency and safe retries'],
      },
      {
        title: 'Over Time',
        lessons: ['Versioning strategies compared', 'Documentation that answers questions'],
      },
    ],
    quizAt: { module: 0, title: 'HTTP semantics check' },
  }),

  /* ── React ecosystem ───────────────────────────────────────────────────── */
  c({
    title: 'Advanced React Patterns and Performance',
    subtitle: 'Composition, memoisation and profiling what is actually slow',
    categoryName: 'React',
    level: 'advanced',
    price: 2899,
    discount: 2099,
    tags: ['react', 'performance', 'patterns', 'frontend'],
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80',
    description:
      'A sequel for people already comfortable with React. Covers the composition patterns that replace prop drilling and context sprawl, the memoisation tools and — importantly — when they cost more than they save, concurrent rendering, and a profiling workflow that finds the real bottleneck instead of the suspected one.',
    learn: [
      'Apply compound components and render props where they fit',
      'Use memo, useMemo and useCallback deliberately, not defensively',
      'Read the React Profiler and act on it',
      'Work with transitions and deferred values',
      'Design context so it does not re-render the world',
    ],
    requirements: ['Solid React experience', 'Comfortable with hooks'],
    modules: [
      {
        title: 'Composition',
        lessons: ['Compound components', 'Render props and hooks as the modern answer', 'Context without the re-render storm'],
      },
      {
        title: 'Performance',
        lessons: ['What memoisation actually costs', 'Reading the React Profiler', 'Virtualising long lists'],
      },
      {
        title: 'Concurrent React',
        lessons: ['Transitions and deferred values', 'Suspense for data'],
      },
    ],
    quizAt: { module: 1, title: 'Memoisation check', required: true },
  }),

  c({
    title: 'State Management in React: Choosing and Using',
    subtitle: 'Local, context, Redux Toolkit, Zustand and server state',
    categoryName: 'React',
    level: 'intermediate',
    price: 2199,
    tags: ['react', 'redux', 'zustand', 'state'],
    thumbnail: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&q=80',
    description:
      'Most state management pain comes from treating server data as application state. This course separates the two first, then walks the options — useState, context, Redux Toolkit, Zustand, TanStack Query — with a clear statement of what each is good at and the size of app where it starts to pay off.',
    learn: [
      'Separate server state from client state and treat them differently',
      'Know when local state and lifting is genuinely enough',
      'Use Redux Toolkit without the boilerplate reputation',
      'Use Zustand for simple global state',
      'Cache, invalidate and sync server data with TanStack Query',
    ],
    requirements: ['Comfortable with React hooks'],
    modules: [
      {
        title: 'The Distinction',
        lessons: ['Server state is not application state', 'When local state is enough'],
      },
      {
        title: 'Client State',
        lessons: ['Context and its limits', 'Redux Toolkit today', 'Zustand and minimal stores'],
      },
      {
        title: 'Server State',
        lessons: ['TanStack Query: caching and invalidation', 'Optimistic updates that roll back'],
      },
    ],
    quizAt: { module: 0, title: 'State classification check' },
  }),

  c({
    title: 'Testing React Applications',
    subtitle: 'Unit, integration and end-to-end, at the right proportions',
    categoryName: 'React',
    level: 'intermediate',
    price: 2299,
    tags: ['testing', 'react', 'vitest', 'playwright'],
    thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80',
    description:
      'Tests that assert implementation details break on every refactor and catch nothing. This course covers testing behaviour instead: Testing Library queries that mirror how users find things, mocking at the network boundary rather than the module, and choosing where a test belongs so the suite stays fast and trustworthy.',
    learn: [
      'Test behaviour rather than implementation',
      'Query the DOM the way a user would',
      'Mock at the network boundary with MSW',
      'Write end-to-end tests that are not flaky',
      'Decide where each test belongs',
    ],
    requirements: ['React experience', 'Some JavaScript testing exposure helps'],
    modules: [
      {
        title: 'Principles',
        lessons: ['Why implementation-detail tests fail', 'The testing trophy, not the pyramid'],
      },
      {
        title: 'Component Testing',
        lessons: ['Testing Library queries and priorities', 'User events and async assertions', 'Mocking the network with MSW'],
      },
      {
        title: 'End to End',
        lessons: ['Playwright basics', 'Making E2E tests reliable'],
      },
    ],
    quizAt: { module: 1, title: 'Testing practice check' },
  }),

  c({
    title: 'Tailwind CSS: Utility-First Without the Mess',
    subtitle: 'Design tokens, component extraction and maintainable markup',
    categoryName: 'Web Development',
    level: 'beginner',
    price: 0,
    tags: ['tailwind', 'css', 'design-system', 'frontend'],
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
    description:
      'Tailwind is fast to write and easy to turn into unreadable markup. This course covers configuring the design system first — colours, spacing, typography as tokens — then the discipline of extracting components at the right moment, handling dark mode and theming, and keeping class lists legible.',
    learn: [
      'Configure Tailwind as a design system rather than using defaults',
      'Know when to extract a component and when to repeat utilities',
      'Implement theming and dark mode cleanly',
      'Build responsive layouts with the breakpoint system',
      'Keep long class lists readable and consistent',
    ],
    requirements: ['Working knowledge of CSS'],
    modules: [
      {
        title: 'Foundations',
        lessons: ['Why utility-first, and the honest objections', 'Configuring tokens and the theme', 'Responsive and state variants'],
      },
      {
        title: 'Staying Maintainable',
        lessons: ['When to extract a component', 'Theming and dark mode', 'Keeping class lists readable'],
      },
    ],
  }),

  /* ── Business / technology ─────────────────────────────────────────────── */
  c({
    title: 'Product Management for Technical Teams',
    subtitle: 'Discovery, prioritisation and saying no with a reason',
    categoryName: 'Business/Technology',
    level: 'beginner',
    price: 2199,
    tags: ['product-management', 'strategy', 'discovery', 'prioritisation'],
    thumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
    description:
      'Product management is mostly deciding what not to build and being able to explain why. This course covers discovery that tests assumptions before code, prioritisation frameworks and their failure modes, writing specifications engineers can act on, and the stakeholder conversations that decide whether any of it survives contact with the roadmap.',
    learn: [
      'Run discovery that tests assumptions cheaply',
      'Prioritise with a framework and know its blind spots',
      'Write a specification an engineer can build from',
      'Define success metrics before launch',
      'Say no in a way that keeps the relationship',
    ],
    requirements: ['No product experience required'],
    modules: [
      {
        title: 'Discovery',
        lessons: ['Assumptions and the cheapest test', 'Talking to users without leading them', 'Opportunity solution trees'],
      },
      {
        title: 'Deciding',
        lessons: ['Prioritisation frameworks and their blind spots', 'Writing a spec engineers can use', 'Success metrics defined before launch'],
      },
      {
        title: 'People',
        lessons: ['Stakeholder management', 'Saying no with a reason'],
      },
    ],
  }),

  c({
    title: 'Agile Delivery: Practices That Survive Contact With Reality',
    subtitle: 'Estimation, flow and retrospectives that change something',
    categoryName: 'Business/Technology',
    level: 'beginner',
    price: 0,
    tags: ['agile', 'scrum', 'kanban', 'delivery'],
    thumbnail: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&q=80',
    description:
      'Most teams doing "agile" have inherited ceremonies without the reasoning. This course goes back to what each practice is for, is candid about where Scrum and Kanban each fit, and spends real time on the two things that decide delivery: limiting work in progress, and retrospectives that produce a change rather than a list.',
    learn: [
      'Understand what each ceremony is actually for',
      'Choose between Scrum and Kanban for your context',
      'Estimate in a way that informs rather than commits',
      'Limit work in progress and see the effect on flow',
      'Run retrospectives that change something',
    ],
    requirements: ['No prior experience required'],
    modules: [
      {
        title: 'Frameworks',
        lessons: ['What the ceremonies are for', 'Scrum and Kanban compared honestly'],
      },
      {
        title: 'Flow',
        lessons: ['Estimation without false precision', 'Work in progress limits and cycle time', 'Retrospectives that produce change'],
      },
    ],
  }),

  c({
    title: 'Technical Writing for Engineers',
    subtitle: 'Documentation, RFCs and explanations people finish reading',
    categoryName: 'Business/Technology',
    level: 'beginner',
    price: 1599,
    tags: ['writing', 'documentation', 'communication', 'rfc'],
    thumbnail: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&q=80',
    description:
      'Writing is a large part of senior engineering work and almost never taught. This course covers structuring a document for a reader who will skim, the four documentation types and why mixing them fails, writing an RFC that gets a decision, and editing your own drafts down to something people finish.',
    learn: [
      'Structure a document around what the reader needs',
      'Distinguish tutorial, how-to, reference and explanation',
      'Write an RFC that produces a decision',
      'Write a commit message and PR description worth reading',
      'Edit your own work ruthlessly',
    ],
    requirements: ['No writing background required'],
    modules: [
      {
        title: 'Structure',
        lessons: ['Writing for a skimming reader', 'The four documentation types', 'Choosing the right level of detail'],
      },
      {
        title: 'Formats',
        lessons: ['RFCs and design documents', 'READMEs that get someone started', 'Commit messages and PR descriptions'],
      },
      {
        title: 'Craft',
        lessons: ['Editing your own drafts'],
      },
    ],
  }),

  c({
    title: 'System Design Interview Preparation',
    subtitle: 'Scaling, trade-offs and communicating a design under pressure',
    categoryName: 'Business/Technology',
    level: 'advanced',
    price: 3299,
    discount: 2399,
    tags: ['system-design', 'interview', 'architecture', 'scalability'],
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80',
    description:
      'System design interviews test whether you can reason about trade-offs out loud. This course drills the building blocks — load balancing, caching, sharding, queues, consistency models — then works through complete designs, with equal attention to the communication structure that keeps a 45-minute discussion coherent.',
    learn: [
      'Structure a design discussion from requirements to trade-offs',
      'Estimate capacity without pretending to precision',
      'Apply caching, sharding and replication appropriately',
      'Reason about consistency and availability concretely',
      'Communicate a design clearly under time pressure',
    ],
    requirements: ['Several years of software engineering experience', 'Familiarity with backend systems'],
    modules: [
      {
        title: 'Building Blocks',
        lessons: ['Load balancing and routing', 'Caching layers and invalidation', 'Sharding, replication and consistency', 'Queues and asynchronous work'],
      },
      {
        title: 'Complete Designs',
        lessons: ['Designing a URL shortener', 'Designing a news feed', 'Designing a rate limiter'],
      },
      {
        title: 'The Interview',
        lessons: ['Structuring the 45 minutes', 'Talking through trade-offs'],
      },
    ],
    quizAt: { module: 0, title: 'Building blocks check', required: true },
  }),

  c({
    title: 'Blockchain and Smart Contracts: A Developer Primer',
    subtitle: 'How the chain works, and writing Solidity that does not lose funds',
    categoryName: 'Business/Technology',
    level: 'intermediate',
    price: 2999,
    tags: ['blockchain', 'solidity', 'web3', 'smart-contracts'],
    thumbnail: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&q=80',
    description:
      'A technical, non-promotional introduction. Covers how consensus and blocks actually work, the EVM execution model, and Solidity with a heavy emphasis on the vulnerability classes — reentrancy, integer issues, access control — that have cost real money. Clear about what this technology is and is not good for.',
    learn: [
      'Explain consensus, blocks and finality',
      'Understand the EVM execution and gas model',
      'Write and test a Solidity contract',
      'Recognise and prevent the common vulnerability classes',
      'Judge honestly when a blockchain is the wrong tool',
    ],
    requirements: ['Programming experience', 'Basic cryptography awareness helps'],
    modules: [
      {
        title: 'The Chain',
        lessons: ['Blocks, consensus and finality', 'The EVM and the gas model'],
      },
      {
        title: 'Contracts',
        lessons: ['Solidity fundamentals', 'Testing and local development', 'Reentrancy and other costly bugs'],
      },
      {
        title: 'Judgement',
        lessons: ['When a database is the better answer'],
      },
    ],
    quizAt: { module: 1, title: 'Contract security check', required: true },
  }),

  c({
    title: 'Excel and Power BI for Business Analysis',
    subtitle: 'Modelling, DAX and dashboards that inform a decision',
    categoryName: 'Business/Technology',
    level: 'beginner',
    price: 1799,
    tags: ['excel', 'power-bi', 'analytics', 'business'],
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
    description:
      'The analysis tools most businesses actually run on. Covers Excel beyond formulas — Power Query, data models, pivot analysis — then Power BI for shared reporting, with real attention to data modelling, because a star schema is what separates a report that answers questions from one that just renders.',
    learn: [
      'Clean and reshape data with Power Query',
      'Build a data model with proper relationships',
      'Write DAX measures that aggregate correctly',
      'Design dashboards around decisions, not metrics',
      'Publish and share reports safely',
    ],
    requirements: ['Basic spreadsheet familiarity'],
    modules: [
      {
        title: 'Excel Beyond Formulas',
        lessons: ['Power Query for cleaning', 'Data models and relationships', 'Pivot analysis that scales'],
      },
      {
        title: 'Power BI',
        lessons: ['Star schemas and why they matter', 'DAX measures and context', 'Dashboards built around decisions'],
      },
    ],
  }),

  /* ── A few more, filling out the catalogue ─────────────────────────────── */
  c({
    title: 'Prompt Engineering and LLM Application Patterns',
    subtitle: 'Structured prompting, retrieval, evaluation and cost control',
    categoryName: 'Artificial Intelligence',
    level: 'intermediate',
    price: 2499,
    tags: ['llm', 'prompting', 'rag', 'ai-engineering'],
    thumbnail: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&q=80',
    description:
      'Building on language models is an engineering discipline with its own failure modes. This course covers structured prompting, retrieval-augmented generation and where it breaks, evaluation you can run in CI, guardrails, and the cost and latency management that decides whether a feature is viable in production.',
    learn: [
      'Write prompts with structure rather than incantation',
      'Build retrieval that surfaces the right context',
      'Evaluate outputs systematically instead of by vibes',
      'Add guardrails for the failure cases that matter',
      'Control cost and latency in production',
    ],
    requirements: ['Programming experience', 'Basic familiarity with APIs'],
    modules: [
      {
        title: 'Prompting',
        lessons: ['Structure, examples and output formats', 'Decomposition and chaining', 'Where prompting stops working'],
      },
      {
        title: 'Retrieval',
        lessons: ['Chunking, embedding and search', 'Why RAG returns the wrong context', 'Grounding and citation'],
      },
      {
        title: 'Production',
        lessons: ['Evaluation you can run in CI', 'Guardrails and failure handling', 'Cost, latency and caching'],
      },
    ],
    quizAt: { module: 1, title: 'Retrieval check' },
  }),

  c({
    title: 'Kubernetes Operations: Running Clusters in Production',
    subtitle: 'Workloads, networking, storage and the day-two problems',
    categoryName: 'DevOps',
    level: 'advanced',
    price: 3899,
    discount: 2899,
    tags: ['kubernetes', 'operations', 'devops', 'containers'],
    thumbnail: 'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=800&q=80',
    description:
      'Getting a pod running is day one. This course is about day two: resource limits and what happens when you get them wrong, networking and ingress, persistent storage, RBAC, upgrades, and debugging a cluster where the symptom and the cause are in different namespaces.',
    learn: [
      'Set requests and limits with an understanding of the consequences',
      'Configure ingress, services and network policy',
      'Handle persistent storage and stateful workloads',
      'Design RBAC that follows least privilege',
      'Debug a cluster methodically under pressure',
    ],
    requirements: ['Docker experience', 'Linux and networking fundamentals'],
    modules: [
      {
        title: 'Workloads',
        lessons: ['Deployments, StatefulSets and DaemonSets', 'Requests, limits and eviction', 'Probes and rolling updates'],
      },
      {
        title: 'Platform',
        lessons: ['Services, ingress and network policy', 'Persistent volumes and storage classes', 'RBAC and least privilege'],
      },
      {
        title: 'Day Two',
        lessons: ['Upgrades without downtime', 'Debugging a cluster methodically'],
      },
    ],
    quizAt: { module: 0, title: 'Workloads and limits check', required: true },
  }),

  c({
    title: 'Data Engineering Pipelines with Airflow',
    subtitle: 'Orchestration, idempotency and backfills that do not ruin a week',
    categoryName: 'Data Science',
    level: 'intermediate',
    price: 2899,
    tags: ['airflow', 'data-engineering', 'etl', 'orchestration'],
    thumbnail: 'https://images.unsplash.com/photo-1543286386-713bdd548da4?w=800&q=80',
    description:
      'Pipelines fail, and what matters is whether rerunning them is safe. This course covers Airflow DAG design with idempotency as the central discipline, scheduling and the execution-date confusion everyone hits, sensible task granularity, and the monitoring that tells you about a silent partial failure.',
    learn: [
      'Design DAGs that are safe to rerun',
      'Understand scheduling, execution dates and catchup',
      'Choose task granularity that aids recovery',
      'Run a backfill without duplicating data',
      'Monitor for silent failures and data quality drift',
    ],
    requirements: ['Python experience', 'SQL knowledge'],
    modules: [
      {
        title: 'DAG Design',
        lessons: ['Idempotency as the central rule', 'Task granularity and recovery', 'Dependencies and branching'],
      },
      {
        title: 'Scheduling',
        lessons: ['Execution dates, intervals and catchup', 'Backfills done safely'],
      },
      {
        title: 'Reliability',
        lessons: ['Alerting on silent failure', 'Data quality checks in the pipeline'],
      },
    ],
    quizAt: { module: 0, title: 'Idempotency check', required: true },
  }),

  c({
    title: 'Ethical Hacking Fundamentals for Defenders',
    subtitle: 'Reconnaissance, scanning and reporting — in an authorised lab',
    categoryName: 'Cybersecurity',
    level: 'intermediate',
    price: 2799,
    tags: ['ethical-hacking', 'pentesting', 'security', 'lab'],
    thumbnail: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=800&q=80',
    description:
      'Understanding how systems are attacked makes you better at defending them. Everything in this course is performed against a deliberately vulnerable lab environment you set up yourself. Covers the assessment methodology, reconnaissance and scanning, common exploitation paths, and the reporting that turns findings into fixes. Authorisation and scope are treated as the first topic, not a footnote.',
    learn: [
      'Understand scope, authorisation and the legal boundaries',
      'Perform reconnaissance and service enumeration',
      'Identify and validate common vulnerability classes in a lab',
      'Understand privilege escalation paths so you can close them',
      'Write a report that leads to remediation',
    ],
    requirements: [
      'Networking and Linux fundamentals',
      'A lab environment you own — never test systems without written authorisation',
    ],
    modules: [
      {
        title: 'Before You Start',
        lessons: ['Authorisation, scope and the law', 'Building an isolated lab'],
      },
      {
        title: 'Assessment',
        lessons: ['Reconnaissance and enumeration', 'Scanning and service identification', 'Validating findings without breaking things'],
      },
      {
        title: 'Reporting',
        lessons: ['Writing findings that get fixed', 'Prioritising by real risk'],
      },
    ],
    quizAt: { module: 0, title: 'Scope and authorisation check', required: true },
  }),

  c({
    title: 'Flutter: Cross-Platform Apps with a Single Codebase',
    subtitle: 'Widgets, state management and shipping to both stores',
    categoryName: 'Mobile Development',
    level: 'beginner',
    price: 2499,
    tags: ['flutter', 'dart', 'mobile', 'cross-platform'],
    thumbnail: 'https://images.unsplash.com/photo-1607252650355-f7fd0460ccdb?w=800&q=80',
    description:
      'Flutter genuinely delivers one codebase for both stores, provided you understand its widget model and stop fighting the layout system. This course covers Dart, composition through widgets, the constraint-based layout that causes most early confusion, state management at app scale, and a signed release for each platform.',
    learn: [
      'Write Dart comfortably',
      'Compose interfaces from stateless and stateful widgets',
      'Reason about constraints so layout stops surprising you',
      'Manage state beyond setState',
      'Build and sign releases for both stores',
    ],
    requirements: ['Some programming experience', 'Dart is covered from scratch'],
    modules: [
      {
        title: 'Dart and Widgets',
        lessons: ['Dart essentials', 'Everything is a widget', 'Stateless and stateful composition'],
      },
      {
        title: 'Layout',
        lessons: ['Constraints down, sizes up', 'Common layout widgets', 'Responsive and adaptive design'],
      },
      {
        title: 'Apps',
        lessons: ['State management at scale', 'Networking and local storage', 'Building signed releases'],
      },
    ],
    quizAt: { module: 1, title: 'Constraints check' },
  }),

  c({
    title: 'Regular Expressions: Precision Pattern Matching',
    subtitle: 'From basics to lookarounds, with the readability discipline',
    categoryName: 'Programming',
    level: 'beginner',
    price: 0,
    tags: ['regex', 'text-processing', 'programming'],
    thumbnail: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800&q=80',
    description:
      'Regular expressions are a small language most people learn by pasting. This course teaches it properly: the matching model, greedy versus lazy quantifiers, groups and backreferences, lookarounds, and the catastrophic backtracking that turns a validation regex into a denial-of-service. Plus when to stop and use a parser.',
    learn: [
      'Read and write patterns with confidence',
      'Control greedy and lazy matching',
      'Use groups, captures and lookarounds',
      'Avoid catastrophic backtracking',
      'Recognise when a regex is the wrong tool',
    ],
    requirements: ['Any programming experience'],
    modules: [
      {
        title: 'The Model',
        lessons: ['Characters, classes and anchors', 'Quantifiers, greedy and lazy', 'Groups and captures'],
      },
      {
        title: 'Going Further',
        lessons: ['Lookahead and lookbehind', 'Catastrophic backtracking', 'When to use a parser instead'],
      },
    ],
    quizAt: { module: 0, title: 'Pattern matching check' },
  }),

  c({
    title: 'Software Architecture: Patterns and Trade-offs',
    subtitle: 'Layering, hexagonal, event-driven — and choosing between them',
    categoryName: 'Business/Technology',
    level: 'advanced',
    price: 3199,
    tags: ['architecture', 'patterns', 'design', 'ddd'],
    thumbnail: 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=800&q=80',
    description:
      'Architecture is the set of decisions that are expensive to reverse. This course covers the major structural patterns with an honest account of what each costs, how to identify the decisions that genuinely matter, and how to document them so the next team knows why rather than guessing.',
    learn: [
      'Identify which decisions are actually architectural',
      'Compare layered, hexagonal and event-driven structures',
      'Apply domain-driven design where it earns its weight',
      'Write architecture decision records that stay useful',
      'Evolve a system without a rewrite',
    ],
    requirements: ['Several years of software development experience'],
    modules: [
      {
        title: 'Fundamentals',
        lessons: ['What makes a decision architectural', 'Coupling, cohesion and change cost'],
      },
      {
        title: 'Patterns',
        lessons: ['Layered and hexagonal architecture', 'Event-driven systems', 'Domain-driven design where it fits'],
      },
      {
        title: 'Practice',
        lessons: ['Architecture decision records', 'Evolving without a rewrite'],
      },
    ],
    quizAt: { module: 1, title: 'Architecture patterns check' },
  }),

  c({
    title: 'Digital Marketing Analytics for Technical Teams',
    subtitle: 'Attribution, experimentation and metrics that are not vanity',
    categoryName: 'Business/Technology',
    level: 'beginner',
    price: 1699,
    tags: ['analytics', 'marketing', 'experimentation', 'metrics'],
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
    description:
      'Written for engineers and analysts who have to implement tracking and then explain the numbers. Covers event design, the attribution problem and why every model is wrong in a different direction, running A/B tests with enough power to mean something, and separating metrics that predict from metrics that merely look good.',
    learn: [
      'Design an event schema you will not regret',
      'Understand attribution models and their built-in biases',
      'Run an A/B test with adequate statistical power',
      'Distinguish leading indicators from vanity metrics',
      'Respect privacy regulation in tracking design',
    ],
    requirements: ['Basic statistics awareness helps'],
    modules: [
      {
        title: 'Measurement',
        lessons: ['Designing an event schema', 'Attribution models and their biases'],
      },
      {
        title: 'Experimentation',
        lessons: ['A/B tests and statistical power', 'Common experiment mistakes'],
      },
      {
        title: 'Reporting',
        lessons: ['Leading indicators versus vanity metrics', 'Privacy-respecting analytics'],
      },
    ],
  }),
];

module.exports = { catalogue };
