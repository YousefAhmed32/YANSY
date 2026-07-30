'use strict';
const File = require('../models/File');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const mediaService = require('../media/media.service');
const { GENERIC_FILE_MIMES, GENERIC_FILE_MAX_BYTES } = require('../media/mediaConstants');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: GENERIC_FILE_MAX_BYTES },
  fileFilter: (req, file, cb) => {
    // First-pass filter by MIME type claim (not trusted — media.service re-verifies
    // against actual magic bytes after upload).
    if (GENERIC_FILE_MIMES.has(file.mimetype)) {
      return cb(null, true);
    }
    cb(new Error(`File type '${file.mimetype}' is not allowed.`));
  },
}).array('files', 10);

// Upload files
exports.uploadFiles = async (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded.' });
    }

    try {
      const uploadedFiles = [];

      for (const file of req.files) {
        let asset;
        try {
          // Validates size + actual magic bytes (not just the claimed Content-Type)
          // and stores the file in GridFS.
          asset = await mediaService.uploadMedia(file.buffer, file.originalname, file.mimetype, {
            allowedMimes: GENERIC_FILE_MIMES,
            maxSizeBytes: GENERIC_FILE_MAX_BYTES,
          });
        } catch (validationErr) {
          return res.status(validationErr.status || 400).json({
            error: `File '${file.originalname}': ${validationErr.message}`,
          });
        }

        const fileDoc = await File.create({
          filename:      `${uuidv4()}-${file.originalname}`,
          originalName:  file.originalname,
          mimeType:      file.mimetype,
          size:          file.size,
          url:           asset.url,
          cloudId:       asset.publicId,
          cloudProvider: asset.provider,
          uploadedBy:    req.user._id,
          project:       req.body.project || null,
          isPublic:      req.body.isPublic === 'true',
        });

        uploadedFiles.push(fileDoc);
      }

      res.status(201).json({ files: uploadedFiles });
    } catch (error) {
      next(error);
    }
  });
};

// Get files (paginated)
exports.getFiles = async (req, res, next) => {
  try {
    const { project, uploadedBy } = req.query;
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const query = {};

    if (project)    query.project    = project;
    if (uploadedBy) query.uploadedBy = uploadedBy;

    // Regular users only see files from their own projects
    if (req.user.role === 'USER') {
      const Project = require('../models/Project');
      const projectIds = await Project.find({ client: req.user._id }).distinct('_id');
      query.$or = [
        { project:    { $in: projectIds } },
        { uploadedBy: req.user._id },
      ];
    }

    const [files, total] = await Promise.all([
      File.find(query)
        .populate('uploadedBy', 'fullName email')
        .populate('project', 'title')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit),
      File.countDocuments(query),
    ]);

    res.json({ files, totalPages: Math.ceil(total / limit), currentPage: page, total });
  } catch (error) {
    next(error);
  }
};

// Get file by ID
exports.getFileById = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id)
      .populate('uploadedBy', 'fullName email')
      .populate('project', 'title');

    if (!file) return res.status(404).json({ error: 'File not found.' });

    // Access check for regular users
    if (req.user.role === 'USER') {
      const Project = require('../models/Project');
      if (file.project) {
        const project = await Project.findById(file.project);
        if (!project || project.client.toString() !== req.user._id.toString()) {
          return res.status(403).json({ error: 'Access denied.' });
        }
      } else if (file.uploadedBy._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Access denied.' });
      }
    }

    res.json({ file });
  } catch (error) {
    next(error);
  }
};

// Delete file
exports.deleteFile = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ error: 'File not found.' });

    if (file.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Permission denied.' });
    }

    await mediaService.deleteMedia(file.cloudId, file.cloudProvider);
    await File.findByIdAndDelete(req.params.id);

    res.json({ message: 'File deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
