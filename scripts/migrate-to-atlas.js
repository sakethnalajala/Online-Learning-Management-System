#!/usr/bin/env node
/**
 * Copies this application's LMS data from one MongoDB to another — typically
 * local -> MongoDB Atlas.
 *
 * Safety properties, by construction:
 *
 *   - It touches exactly 14 named collections, listed below. It never
 *     enumerates databases, never calls listDatabases(), dropDatabase() or
 *     any admin command, and cannot see or affect any other database on the
 *     destination cluster.
 *   - It reports before it writes. With no flags it is a DRY RUN: it connects
 *     to both ends, compares document counts, names any conflict, and exits
 *     without writing a single document.
 *   - Writing requires --apply. Clearing the destination's LMS collections
 *     first requires --replace as well, and that flag is refused unless the
 *     destination database name matches the expected one.
 *   - _id values are preserved exactly, so every ObjectId reference between
 *     users, courses, modules, lessons, enrolments, quizzes and the rest
 *     survives the move intact.
 *
 * Usage:
 *   node scripts/migrate-to-atlas.js                      # dry run (default)
 *   node scripts/migrate-to-atlas.js --apply              # copy, skipping existing docs
 *   node scripts/migrate-to-atlas.js --apply --replace    # clear LMS collections first
 *
 * Source and destination come from the environment:
 *   MIGRATE_FROM   defaults to mongodb://127.0.0.1:27017
 *   MIGRATE_TO     required — your Atlas SRV string
 *   MIGRATE_DB     defaults to lms (used for BOTH ends)
 */

const { MongoClient } = require('mongodb');

/** The only collections this script will ever read or write. */
const COLLECTIONS = [
  'users',
  'categories',
  'courses',
  'modules',
  'lessons',
  'resources',
  'enrollments',
  'progresses',
  'quizzes',
  'questions',
  'quizattempts',
  'reviews',
  'certificates',
  'notifications',
];

const FROM = process.env.MIGRATE_FROM || 'mongodb://127.0.0.1:27017';
const TO = process.env.MIGRATE_TO;
const DB = process.env.MIGRATE_DB || 'lms';

const apply = process.argv.includes('--apply');
const replace = process.argv.includes('--replace');

/** Host only — a connection string must never reach a log line. */
function host(uri) {
  try {
    const parsed = new URL(String(uri).replace(/^mongodb(\+srv)?:\/\//, 'https://'));
    return `${parsed.hostname}${uri.startsWith('mongodb+srv://') ? ' [Atlas]' : ''}`;
  } catch {
    return 'configured host';
  }
}

const pad = (value, width) => String(value).padStart(width);

async function main() {
  if (!TO) {
    console.error('\n  MIGRATE_TO is not set.\n');
    console.error('  Set it to your Atlas connection string, for example:\n');
    console.error('    MIGRATE_TO="mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net" \\');
    console.error('      node scripts/migrate-to-atlas.js\n');
    process.exit(1);
  }

  console.log('\n' + '='.repeat(66));
  console.log('  LMS DATA MIGRATION' + (apply ? '' : '  (DRY RUN — nothing will be written)'));
  console.log('='.repeat(66));
  console.log(`  from      ${host(FROM)}`);
  console.log(`  to        ${host(TO)}`);
  console.log(`  database  ${DB}  (both ends)`);
  console.log(`  mode      ${apply ? (replace ? 'APPLY + REPLACE' : 'APPLY (skip existing)') : 'dry run'}`);
  console.log('='.repeat(66) + '\n');

  const source = new MongoClient(FROM, { serverSelectionTimeoutMS: 15000 });
  const target = new MongoClient(TO, { serverSelectionTimeoutMS: 20000 });

  await source.connect();
  await target.connect();

  const sourceDb = source.db(DB);
  const targetDb = target.db(DB);

  // Belt and braces: both handles must be the expected database.
  for (const [label, handle] of [['source', sourceDb], ['destination', targetDb]]) {
    if (handle.databaseName !== DB) {
      throw new Error(`Refusing to continue: ${label} resolved to "${handle.databaseName}", expected "${DB}".`);
    }
  }

  console.log('  collection        source   destination   action');
  console.log('  ' + '-'.repeat(60));

  const plan = [];
  let totalSource = 0;
  let totalExisting = 0;

  for (const name of COLLECTIONS) {
    const from = await sourceDb.collection(name).countDocuments();
    const to = await targetDb.collection(name).countDocuments();

    totalSource += from;
    totalExisting += to;

    let action;
    if (from === 0) action = 'nothing to copy';
    else if (to === 0) action = `copy ${from}`;
    else if (replace) action = `CLEAR ${to}, copy ${from}`;
    else action = `skip — ${to} already there`;

    console.log(`  ${name.padEnd(16)} ${pad(from, 6)}   ${pad(to, 11)}   ${action}`);
    plan.push({ name, from, to });
  }

  console.log('  ' + '-'.repeat(60));
  console.log(`  ${'TOTAL'.padEnd(16)} ${pad(totalSource, 6)}   ${pad(totalExisting, 11)}\n`);

  const conflicts = plan.filter((row) => row.from > 0 && row.to > 0);

  if (!apply) {
    console.log('  DRY RUN — nothing was written.\n');

    if (totalSource === 0) {
      console.log('  The source database holds no LMS data. Nothing to migrate: seed the');
      console.log('  destination directly instead.\n');
    } else if (conflicts.length === 0) {
      console.log('  No conflict: the destination has no LMS data yet.');
      console.log('  Re-run with --apply to copy it across.\n');
    } else {
      console.log(`  CONFLICT: ${conflicts.length} collection(s) already hold data at the destination:`);
      for (const row of conflicts) console.log(`    - ${row.name}: ${row.to} existing document(s)`);
      console.log('\n  Choose one:');
      console.log('    --apply             copy only the collections that are empty there');
      console.log('    --apply --replace   clear these LMS collections first, then copy');
      console.log('\n  --replace deletes documents in the 14 LMS collections of the');
      console.log(`  "${DB}" database only. No other database is read or written.\n`);
    }

    await source.close();
    await target.close();
    return;
  }

  console.log('  Writing...\n');

  let copied = 0;
  let skipped = 0;

  for (const row of plan) {
    if (row.from === 0) continue;

    if (row.to > 0 && !replace) {
      console.log(`  ${row.name.padEnd(16)} skipped (${row.to} already present)`);
      skipped += 1;
      continue;
    }

    if (row.to > 0 && replace) {
      // Scoped to this one collection in this one database.
      const removed = await targetDb.collection(row.name).deleteMany({});
      console.log(`  ${row.name.padEnd(16)} cleared ${removed.deletedCount}`);
    }

    // Stream in batches so a large collection does not need to fit in memory.
    const cursor = sourceDb.collection(row.name).find({});
    let batch = [];
    let written = 0;

    const flush = async () => {
      if (!batch.length) return;
      // ordered:false so one duplicate cannot halt the rest of the batch.
      await targetDb.collection(row.name).insertMany(batch, { ordered: false });
      written += batch.length;
      batch = [];
    };

    for await (const doc of cursor) {
      // _id is carried over unchanged, which is what keeps every ObjectId
      // reference between collections valid after the move.
      batch.push(doc);
      if (batch.length >= 500) await flush();
    }
    await flush();

    console.log(`  ${row.name.padEnd(16)} copied ${written}`);
    copied += written;
  }

  console.log(`\n  Done. ${copied} document(s) copied${skipped ? `, ${skipped} collection(s) skipped` : ''}.`);

  // Report what the destination now holds, read back from the destination.
  console.log('\n  Destination now holds:');
  let total = 0;
  for (const name of COLLECTIONS) {
    const count = await targetDb.collection(name).countDocuments();
    total += count;
    console.log(`    ${name.padEnd(16)} ${pad(count, 6)}`);
  }
  console.log(`    ${'TOTAL'.padEnd(16)} ${pad(total, 6)}\n`);

  await source.close();
  await target.close();
}

main().catch((err) => {
  console.error('\n  Migration failed:', err.message, '\n');
  process.exit(1);
});
