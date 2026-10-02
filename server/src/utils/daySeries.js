/**
 * Zero-filled daily counts for a collection, for charts.
 *
 * Both the bucket keys and the aggregation run in UTC. Mixing the two — for
 * example generating keys from local midnight while $dateToString buckets in
 * UTC — silently shifts every bucket by a day for anyone not on UTC, which
 * makes today's records vanish from the series.
 */

/** Midnight UTC, `daysAgo` days back from today. */
function utcMidnight(daysAgo = 0) {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysAgo, 0, 0, 0, 0)
  );
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** ['2026-09-01', …] for the last `days` days, ending today (UTC). */
function utcDayKeys(days) {
  const start = utcMidnight(days - 1);
  return Array.from({ length: days }, (_, i) =>
    new Date(start.getTime() + i * DAY_MS).toISOString().slice(0, 10)
  );
}

/**
 * Runs a count-per-day aggregation and returns one entry per day in the
 * window, including days with no records.
 */
async function dailySeries(Model, days, extraMatch = {}) {
  const since = utcMidnight(days - 1);

  const rows = await Model.aggregate([
    { $match: { createdAt: { $gte: since }, ...extraMatch } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' } },
        count: { $sum: 1 },
      },
    },
  ]);

  const counts = new Map(rows.map((row) => [row._id, row.count]));

  return utcDayKeys(days).map((date) => ({ date, count: counts.get(date) || 0 }));
}

module.exports = { dailySeries, utcDayKeys, utcMidnight, DAY_MS };
