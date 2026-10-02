const mongoose = require('mongoose');
const env = require('./env');

/**
 * Host and scheme only — never the credentials, and never the full URI.
 * Used for log lines so a deploy log cannot leak a password.
 */
function describeTarget(uri) {
  try {
    // The driver's SRV scheme is not a valid WHATWG URL scheme, so normalise.
    const parsed = new URL(uri.replace(/^mongodb(\+srv)?:\/\//, 'https://'));
    const kind = uri.startsWith('mongodb+srv://') ? 'Atlas (SRV)' : 'direct';
    return `${parsed.hostname} [${kind}]`;
  } catch {
    return 'configured host';
  }
}

/**
 * Databases this application is permitted to clear.
 *
 * Deliberately a name rule rather than `env.mongoDbName`: checking against the
 * configured value only catches a mismatch between intent and reality, so a
 * typo'd MONGO_DB_NAME would sail straight through and wipe whatever it named.
 * On a cluster shared with unrelated projects that is the failure that matters,
 * so the destructive path is pinned to this app's own namespace instead of to
 * configuration.
 */
const CLEARABLE = /^lms(_[a-z0-9-]+)?$/i;

async function connectDB() {
  mongoose.set('strictQuery', true);

  const conn = await mongoose.connect(env.mongoUri, {
    // Pin the database explicitly. This overrides any database path on the
    // connection string, so on a cluster shared with other projects this
    // application cannot land anywhere but its own database.
    dbName: env.mongoDbName,
    serverSelectionTimeoutMS: 15000,
    autoIndex: !env.isProd,
  });

  const actual = conn.connection.name;

  // Verify rather than assume. A successful handshake says the cluster is
  // reachable; it says nothing about which database we ended up in.
  if (actual !== env.mongoDbName) {
    await mongoose.connection.close();
    throw new Error(
      `Connected to database "${actual}" but this application requires "${env.mongoDbName}". ` +
        'Check MONGO_DB_NAME and the database path on your connection string.'
    );
  }

  console.log(`[db] host     ${describeTarget(env.mongoUri)}`);
  console.log(`[db] Connected to MongoDB database: ${actual}`);

  // Not fatal — a read-only connection to another database is a legitimate
  // thing to want — but it should never happen silently on a shared cluster.
  if (!CLEARABLE.test(actual)) {
    console.warn(
      `[db] WARNING: "${actual}" is not this application's database. ` +
        'Seeding and any bulk clear will refuse to run.'
    );
  }

  mongoose.connection.on('error', (err) => console.error('[db] error:', err.message));
  mongoose.connection.on('disconnected', () => console.warn('[db] disconnected'));

  return conn;
}

async function disconnectDB() {
  await mongoose.connection.close();
}

/**
 * Guard for anything that clears data in bulk.
 *
 * Every destructive operation in this codebase goes through a Mongoose model,
 * which is already scoped to one collection in one database — nothing here can
 * enumerate or reach another database on the cluster. This is the belt to that
 * braces: a reseed aborts unless the live connection is this application's own
 * database, whatever the environment claims.
 */
function assertOwnDatabase(action = 'this operation') {
  const actual = mongoose.connection?.name;

  if (!actual) {
    throw new Error(`Refusing ${action}: no database connection is open.`);
  }

  if (!CLEARABLE.test(actual)) {
    throw new Error(
      `Refusing ${action}: connected to "${actual}", which is not this application's database. ` +
        'Only "lms" (or an lms_* variant) may be cleared — any other database on the cluster ' +
        'belongs to something else. Check MONGO_DB_NAME and your connection string.'
    );
  }

  if (actual !== env.mongoDbName) {
    throw new Error(
      `Refusing ${action}: connected to "${actual}" but MONGO_DB_NAME says "${env.mongoDbName}".`
    );
  }

  return actual;
}

module.exports = { connectDB, disconnectDB, describeTarget, assertOwnDatabase };
