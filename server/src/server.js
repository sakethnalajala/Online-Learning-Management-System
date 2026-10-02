const env = require('./config/env');
const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');

let server;

async function start() {
  console.log(`\n[boot] Lumina LMS API — ${env.nodeEnv}`);

  try {
    await connectDB();
  } catch (err) {
    console.error('\n[boot] Could not connect to MongoDB:', err.message);
    console.error('[boot] Check MONGO_URI in server/.env. For Atlas, confirm the');
    console.error('[boot] password is URL-encoded and your IP is allow-listed.\n');
    process.exit(1);
  }

  server = app.listen(env.port, () => {
    console.log(`[boot] listening on http://localhost:${env.port}`);
    console.log(`[boot] api root  http://localhost:${env.port}/api`);
    console.log(`[boot] cors      ${env.corsOrigins.join(', ')}\n`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n[boot] Port ${env.port} is already in use. Set PORT in server/.env.\n`);
      process.exit(1);
    }
    throw err;
  });
}

/** Close the HTTP server and the DB pool before exiting, so nothing is cut mid-write. */
async function shutdown(signal) {
  console.log(`\n[shutdown] received ${signal}`);
  if (server) await new Promise((resolve) => server.close(resolve));
  await disconnectDB();
  console.log('[shutdown] closed cleanly');
  process.exit(0);
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => shutdown(signal));
}

process.on('unhandledRejection', (reason) => {
  console.error('[fatal] unhandled promise rejection:', reason);
  shutdown('unhandledRejection');
});

process.on('uncaughtException', (err) => {
  console.error('[fatal] uncaught exception:', err);
  process.exit(1);
});

start();
