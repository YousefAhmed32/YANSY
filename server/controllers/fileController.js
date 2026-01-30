const File = require('../models/File');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { uploadToCloud, deleteFromCloud } = require('../utils/cloudStorage');

// Configure multer for memory storage (files will be uploaded to cloud)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Accept images and common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|zip/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type'));
  }
}).array('files', 10);

// Upload files
exports.uploadFiles = async (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    try {
      const uploadedFiles = [];

      for (const file of req.files) {
        const { url, cloudId } = await uploadToCloud(
          file.buffer,
          file.originalname,
          file.mimetype
        );

        const fileDoc = await File.create({
          filename: `${uuidv4()}-${file.originalname}`,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          url,
          cloudId,
          cloudProvider: process.env.CLOUD_PROVIDER || 'cloudinary',
          uploadedBy: req.user._id,
          project: req.body.project || null,
          isPublic: req.body.isPublic === 'true'
        });

        uploadedFiles.push(fileDoc);
      }

      res.status(201).json({ files: uploadedFiles });
    } catch (error) {
      next(error);
    }
  });
};

// Get files
exports.getFiles = async (req, res, next) => {
  try {
    const { project, uploadedBy, page = 1, limit = 20 } = req.query;
    const query = {};

    if (project) query.project = project;
    if (uploadedBy) query.uploadedBy = uploadedBy;

    // Users can only see files from their projects
    if (req.user.role === 'USER') {
      query.$or = [
        { project: { $in: await require('../models/Project').find({ client: req.user._id }).distinct('_id') } },
        { uploadedBy: req.user._id }
      ];
    }

    const files = await File.find(query)
      .populate('uploadedBy', 'name email')
      .populate('project', 'title')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await File.countDocuments(query);

    res.json({
      files,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    next(error);
  }
};

// Get file by ID
exports.getFileById = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id)
      .populate('uploadedBy', 'name email')
      .populate('project', 'title');

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
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

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Only allow deletion by uploader or admin
    if (file.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // Delete from cloud storage
    await deleteFromCloud(file.cloudId, file.cloudProvider);

    await File.findByIdAndDelete(req.params.id);
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    next(error);
  }
};

