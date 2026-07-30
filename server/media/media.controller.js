'use strict';
const mongoose = require('mongoose');
const repo = require('./gridfsRepository');

const RANGE_RE = /^bytes=(\d*)-(\d*)$/;

const getMedia = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid media id' });
    }

    const file = await repo.findFileById(id);
    if (!file) return res.status(404).json({ error: 'Media not found' });

    const length = file.length;
    // contentType lives in metadata (see gridfsRepository.uploadBuffer) — the
    // top-level field is only a fallback for pre-existing legacy GridFS files.
    const contentType = file.metadata?.contentType || file.contentType || 'application/octet-stream';
    // Content-addressed via sha256 dedupe at upload time — a given id's bytes never
    // change, so caching it immutably forever is safe.
    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.set('ETag', `"${file._id}"`);
    res.set('Accept-Ranges', 'bytes');
    res.set('Last-Modified', file.uploadDate.toUTCString());

    if (req.headers['if-none-match'] === `"${file._id}"`) {
      return res.status(304).end();
    }

    const rangeHeader = req.headers.range;
    let stream;

    if (rangeHeader) {
      const match = RANGE_RE.exec(rangeHeader);
      if (!match) {
        res.set('Content-Range', `bytes */${length}`);
        return res.status(416).end();
      }
      const start = match[1] ? parseInt(match[1], 10) : 0;
      const end = match[2] ? parseInt(match[2], 10) : length - 1;
      if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= length) {
        res.set('Content-Range', `bytes */${length}`);
        return res.status(416).end();
      }
      const clampedEnd = Math.min(end, length - 1);

      res.status(206);
      res.set('Content-Range', `bytes ${start}-${clampedEnd}/${length}`);
      res.set('Content-Length', String(clampedEnd - start + 1));
      // GridFS `end` is exclusive — add 1 to the inclusive HTTP range end.
      stream = repo.openDownloadStream(id, { start, end: clampedEnd + 1 });
    } else {
      res.status(200);
      res.set('Content-Length', String(length));
      stream = repo.openDownloadStream(id);
    }

    stream.on('error', (err) => {
      if (res.headersSent) return res.destroy();
      next(err);
    });
    stream.pipe(res);
  } catch (err) {
    next(err);
  }
};

module.exports = { getMedia };
