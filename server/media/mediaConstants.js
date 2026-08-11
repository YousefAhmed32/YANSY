'use strict';

// Extension is always derived from the *validated* mime (post magic-byte check),
// never trusted from the client-supplied filename.
const MIME_TO_EXT = {
  'image/jpeg': '.jpg',
  'image/jpg':  '.jpg',
  'image/png':  '.png',
  'image/webp': '.webp',
  'image/gif':  '.gif',
  'image/svg+xml': '.svg',
  'video/mp4':       '.mp4',
  'video/webm':      '.webm',
  'video/quicktime': '.mov',
  'audio/mpeg': '.mp3',
  'audio/mp3':  '.mp3',
  'audio/wav':  '.wav',
  'audio/x-wav':'.wav',
  'audio/ogg':  '.ogg',
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/zip': '.zip',
  'text/plain': '.txt',
};

// SVG is deliberately included here (not a separate set) so every existing
// consumer of IMAGE_MIMES — logo/avatar uploads, the generic file uploader —
// gains SVG support in one place. Raw SVG can carry <script>/on* handlers, so
// uploads are sanitized in media.service.js before they're hashed/stored;
// never trust an SVG buffer that skipped that step.
const IMAGE_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
const VIDEO_MIMES = ['video/mp4', 'video/webm', 'video/quicktime'];
const AUDIO_MIMES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/ogg'];
const DOCUMENT_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'text/plain',
];

// Per-feature allow-lists + size ceilings, mirroring each route's existing multer config.
const PORTFOLIO_MIMES = new Set([...IMAGE_MIMES, ...VIDEO_MIMES, ...AUDIO_MIMES]);
const PORTFOLIO_MAX_BYTES = 60 * 1024 * 1024;

const IMAGE_ONLY_MIMES = new Set(IMAGE_MIMES);
const LOGO_MAX_BYTES = 10 * 1024 * 1024;

const VIDEO_ONLY_MIMES = new Set(VIDEO_MIMES);
const VIDEO_MAX_BYTES = 200 * 1024 * 1024;

const GENERIC_FILE_MIMES = new Set([...IMAGE_MIMES, ...DOCUMENT_MIMES]);
const GENERIC_FILE_MAX_BYTES = 10 * 1024 * 1024;

module.exports = {
  MIME_TO_EXT,
  IMAGE_MIMES,
  VIDEO_MIMES,
  AUDIO_MIMES,
  DOCUMENT_MIMES,
  PORTFOLIO_MIMES,
  PORTFOLIO_MAX_BYTES,
  IMAGE_ONLY_MIMES,
  LOGO_MAX_BYTES,
  VIDEO_ONLY_MIMES,
  VIDEO_MAX_BYTES,
  GENERIC_FILE_MIMES,
  GENERIC_FILE_MAX_BYTES,
};
