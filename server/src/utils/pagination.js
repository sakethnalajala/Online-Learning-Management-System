/**
 * Normalises ?page & ?limit into safe integers with an upper bound so a client
 * cannot ask for the entire collection in one request.
 */
function getPagination(query, { defaultLimit = 12, maxLimit = 100 } = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const rawLimit = parseInt(query.limit, 10) || defaultLimit;
  const limit = Math.min(Math.max(1, rawLimit), maxLimit);
  return { page, limit, skip: (page - 1) * limit };
}

module.exports = { getPagination };
