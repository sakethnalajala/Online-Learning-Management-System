const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');

const env = require('./config/env');
const routes = require('./routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const { uploadRoot } = require('./middleware/upload');

const app = express();

// Render and Vercel sit behind a proxy; without this, rate limiting and
// secure cookies see the proxy instead of the client.
app.set('trust proxy', 1);

app.use(
  helmet({
    // Uploaded media is served from this origin and embedded by the frontend.
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  })
);

const corsOptions = {
  origin(origin, callback) {
    // Allow non-browser callers (curl, health checks) which send no Origin.
    if (!origin) return callback(null, true);
    if (env.corsOrigins.includes(origin)) return callback(null, true);
    // Any Vercel preview deployment of this project.
    if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) return callback(null, true);
    return callback(new Error(`Origin "${origin}" is not allowed by CORS.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());
app.use(compression());

// Strips $ and . operators from request payloads so a crafted body cannot
// smuggle query operators into a Mongo filter.
app.use(mongoSanitize({ replaceWith: '_' }));

if (!env.isProd) app.use(morgan('dev'));

// Static uploads.
app.use(
  `/${env.uploadDir}`,
  express.static(uploadRoot, { maxAge: env.isProd ? '30d' : 0, fallthrough: true })
);

app.get('/health', (_req, res) =>
  res.json({
    success: true,
    status: 'ok',
    env: env.nodeEnv,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  })
);

app.get('/', (_req, res) =>
  res.json({ success: true, message: 'Lumina LMS API is running. See /api for endpoints.' })
);

app.use('/api', apiLimiter, routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
