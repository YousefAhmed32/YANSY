'use strict';
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// ── Cloudinary ────────────────────────────────────────────────────────────────

let cloudinaryInstance = null;

const getCloudinary = () => {
  if (cloudinaryInstance) return cloudinaryInstance;
  try {
    const cloudinary = require('cloudinary').v2;
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key:    process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      throw new Error('CLOUDINARY_CLOUD_NAME not set');
    }
    cloudinaryInstance = cloudinary;
    return cloudinary;
  } catch (err) {
    console.warn('[cloudStorage] Cloudinary not available:', err.message);
    return null;
  }
};

const uploadToCloudinary = async (fileBuffer, filename, mimeType) => {
  const cloudinary = getCloudinary();
  if (!cloudinary) throw new Error('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env');

  const resourceType = mimeType.startsWith('image/') ? 'image'
    : mimeType === 'application/pdf' ? 'raw'
    : 'auto';

  const publicId = `yansy/${uuidv4()}-${path.basename(filename, path.extname(filename))}`;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id:     publicId,
        resource_type: resourceType,
        folder:        'yansy',
        tags:          ['yansy-platform'],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url:      result.secure_url,
          cloudId:  result.public_id,
          provider: 'cloudinary',
        });
      }
    );
    uploadStream.end(fileBuffer);
  });
};

const deleteFromCloudinary = async (cloudId) => {
  const cloudinary = getCloudinary();
  if (!cloudinary) return;
  try {
    await cloudinary.uploader.destroy(cloudId);
  } catch (err) {
    console.error('[cloudStorage] Failed to delete from Cloudinary:', err.message);
  }
};

// ── Local fallback (development only) ────────────────────────────────────────

const fs   = require('fs');
const pathM = require('path');

const uploadToLocal = async (fileBuffer, filename, mimeType) => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Local file storage is not available in production. Configure Cloudinary.');
  }
  const uploadsDir = pathM.join(__dirname, '../uploads/files');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const uniqueName = `${uuidv4()}-${filename}`;
  const filePath   = pathM.join(uploadsDir, uniqueName);
  fs.writeFileSync(filePath, fileBuffer);

  const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
  return {
    url:      `${baseUrl}/uploads/files/${uniqueName}`,
    cloudId:  uniqueName,
    provider: 'local',
  };
};

const deleteFromLocal = async (cloudId) => {
  try {
    const filePath = pathM.join(__dirname, '../uploads/files', cloudId);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (err) {
    console.error('[cloudStorage] Failed to delete local file:', err.message);
  }
};

// ── Main API ──────────────────────────────────────────────────────────────────

const uploadToCloud = async (fileBuffer, filename, mimeType) => {
  const provider = process.env.CLOUD_PROVIDER || 'cloudinary';

  if (provider === 'cloudinary' || provider === 'auto') {
    // Try Cloudinary; fall back to local in development
    try {
      return await uploadToCloudinary(fileBuffer, filename, mimeType);
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[cloudStorage] Cloudinary failed, using local fallback:', err.message);
        return await uploadToLocal(fileBuffer, filename, mimeType);
      }
      throw err;
    }
  }

  if (provider === 'local') {
    return await uploadToLocal(fileBuffer, filename, mimeType);
  }

  throw new Error(`Unsupported CLOUD_PROVIDER: ${provider}`);
};

const deleteFromCloud = async (cloudId, provider) => {
  const p = provider || process.env.CLOUD_PROVIDER || 'cloudinary';
  if (p === 'cloudinary') return deleteFromCloudinary(cloudId);
  if (p === 'local')      return deleteFromLocal(cloudId);
};

module.exports = { uploadToCloud, deleteFromCloud };
