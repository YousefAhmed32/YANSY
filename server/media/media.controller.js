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

    // 1. FAST 304 CHECK BEFORE DB (0ms response for cached browser requests)
    const clientEtag = req.headers['if-none-match'];
    if (clientEtag && (clientEtag === `"${id}"` || clientEtag === id)) {
      res.set('Content-Type', req.headers['accept'] || 'application/octet-stream');
      res.set('Cache-Control', 'public, max-age=31536000, immutable');
      res.set('ETag', `"${id}"`);
      return res.status(304).end();
    }

    // 2. METADATA LOOKUP (Uses in-memory LRU cache)
    const file = await repo.findFileById(id);
    if (!file) return res.status(404).json({ error: 'Media not found' });

    const length = file.length;
    const contentType = file.metadata?.contentType || file.contentType || 'application/octet-stream';

    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.set('ETag', `"${file._id}"`);
    res.set('Accept-Ranges', 'bytes');
    res.set('Last-Modified', file.uploadDate ? file.uploadDate.toUTCString() : new Date().toUTCString());

    const rangeHeader = req.headers.range;

    // 3. CHECK IN-MEMORY BUFFER CACHE (Ultra-fast RAM serving for files <= 4MB)
    const cachedBuffer = repo.getCachedBuffer(id);
    if (cachedBuffer) {
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
        return res.send(cachedBuffer.subarray(start, clampedEnd + 1));
      }

      res.status(200);
      res.set('Content-Length', String(length));
      return res.send(cachedBuffer);
    }

    // 4. RANGE REQUEST (Not cached in RAM)
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
      const stream = repo.openDownloadStream(id, { start, end: clampedEnd + 1 });
      stream.on('error', (err) => {
        if (res.headersSent) return res.destroy();
        next(err);
      });
      return stream.pipe(res);
    }

    // 5. FULL FILE (Small files <= 4MB read into RAM and cached for next time)
    if (length <= 4 * 1024 * 1024) {
      const chunks = [];
      const stream = repo.openDownloadStream(id);
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => {
        const fullBuf = Buffer.concat(chunks);
        repo.setCachedBuffer(id, fullBuf);
        if (!res.writableEnded) {
          res.status(200);
          res.set('Content-Length', String(length));
          res.send(fullBuf);
        }
      });
      stream.on('error', (err) => {
        if (res.headersSent) return res.destroy();
        next(err);
      });
    } else {
      res.status(200);
      res.set('Content-Length', String(length));
      const stream = repo.openDownloadStream(id);
      stream.on('error', (err) => {
        if (res.headersSent) return res.destroy();
        next(err);
      });
      stream.pipe(res);
    }
  } catch (err) {
    next(err);
  }
};

module.exports = { getMedia };
