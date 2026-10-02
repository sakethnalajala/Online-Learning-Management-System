const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const uploadRoot = path.resolve(__dirname, '../../', env.uploadDir);
if (!fs.existsSync(uploadRoot)) fs.mkdirSync(uploadRoot, { recursive: true });

const BUCKETS = {
  'image/': 'images',
  'video/': 'videos',
  'application/pdf': 'documents',
  'application/msword': 'documents',
  'application/vnd.openxmlformats-officedocument': 'documents',
  'text/': 'documents',
};

const bucketFor = (mime) => {
  const hit = Object.keys(BUCKETS).find((prefix) => mime.startsWith(prefix));
  return hit ? BUCKETS[hit] : 'misc';
};

const ALLOWED = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/markdown',
  'text/csv',
];

const storage = multer.diskStorage({
  destination(_req, file, cb) {
    const dir = path.join(uploadRoot, bucketFor(file.mimetype));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(_req, file, cb) {
    // Never trust the client's filename — keep only a sanitised extension.
    const ext = path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '');
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (ALLOWED.includes(file.mimetype)) return cb(null, true);
  cb(ApiError.badRequest(`Unsupported file type "${file.mimetype}".`));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.maxUploadMb * 1024 * 1024, files: 5 },
});

/** Public URL path for a stored file, relative to the API host. */
const publicUrl = (file) =>
  ['', env.uploadDir, bucketFor(file.mimetype), file.filename].join('/');

module.exports = { upload, uploadRoot, publicUrl, bucketFor, ALLOWED };
