/**
 * Every successful response has the same envelope so the frontend can rely on
 * `data` regardless of which endpoint answered.
 *   { success: true, message, data, meta? }
 */
function ok(res, data = null, message = 'OK', meta = undefined) {
  const body = { success: true, message, data };
  if (meta) body.meta = meta;
  return res.status(200).json(body);
}

function created(res, data = null, message = 'Created') {
  return res.status(201).json({ success: true, message, data });
}

function noContent(res) {
  return res.status(204).send();
}

function paginated(res, items, { page, limit, total }, message = 'OK') {
  return res.status(200).json({
    success: true,
    message,
    data: items,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  });
}

module.exports = { ok, created, noContent, paginated };
