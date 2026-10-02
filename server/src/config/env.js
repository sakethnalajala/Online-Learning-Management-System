const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// MONGODB_URI is accepted as an alias for MONGO_URI: Render, Atlas and most
// tutorials use the longer spelling, and silently ignoring it would present as
// "missing MONGO_URI" on a correctly configured host.
const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

const missing = [];
if (!mongoUri) missing.push('MONGO_URI (or MONGODB_URI)');
if (!process.env.JWT_SECRET) missing.push('JWT_SECRET');

if (missing.length) {
  // Fail fast and loudly — a half-configured auth/database layer is worse than no boot.
  console.error(`\n[config] Missing required environment variables: ${missing.join(', ')}`);
  console.error('[config] Copy .env.example to .env and fill in the values.\n');
  process.exit(1);
}

const toList = (value) =>
  (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: (process.env.NODE_ENV || 'development') === 'production',
  port: Number(process.env.PORT || 5000),

  mongoUri,

  /**
   * The database this application owns, set explicitly rather than inferred
   * from the path on the connection string.
   *
   * Atlas connection strings are routinely copied without a database path, in
   * which case the driver would quietly fall back to `test` — and a cluster
   * shared with other projects makes guessing the wrong database expensive.
   * Passing this as `dbName` to mongoose.connect() overrides whatever the URI
   * says, so this app can only ever read and write here.
   */
  mongoDbName: process.env.MONGO_DB_NAME || 'lms',

  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || `${process.env.JWT_SECRET}_refresh`,
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  saltRounds: Number(process.env.BCRYPT_SALT_ROUNDS || 10),

  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  corsOrigins: toList(process.env.CORS_ORIGINS || process.env.CLIENT_URL || 'http://localhost:5173'),

  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB || 50),

  /**
   * Demo credentials. Each role gets its own password so a leaked student
   * login cannot be reused to reach the instructor or admin portal. These are
   * demonstration accounts only and are shown openly on the login screen.
   */
  demoPasswords: {
    student: process.env.DEMO_STUDENT_PASSWORD || 'Student@2026',
    instructor: process.env.DEMO_INSTRUCTOR_PASSWORD || 'Teach@2026',
    admin: process.env.DEMO_ADMIN_PASSWORD || 'Admin@2026',
  },
};

module.exports = env;
