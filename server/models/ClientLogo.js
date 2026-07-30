const mongoose = require('mongoose');

// Brand names aren't translated (a client's name stays the same in AR/EN
// contexts), so unlike PortfolioProject there's no *Ar sibling field here.
const logoAssetSchema = new mongoose.Schema(
  {
    url:      { type: String, required: true },
    publicId: { type: String },
    // 'cloudinary'/'local' kept only so pre-GridFS documents still deserialize —
    // every new upload writes 'gridfs' (see server/media/media.service.js).
    provider: { type: String, enum: ['cloudinary', 'local', 'gridfs'], default: 'gridfs' },
    width:    { type: Number },
    height:   { type: Number },
  },
  { _id: false }
);

const clientLogoSchema = new mongoose.Schema(
  {
    name:    { type: String, required: true, trim: true },
    slug:    { type: String, required: true, unique: true },
    logo:    { type: logoAssetSchema, required: true },
    website: { type: String, default: '', trim: true },
    order:   { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Public read path filters on isActive and sorts by order — this compound
// index serves that query directly instead of an in-memory sort.
clientLogoSchema.index({ isActive: 1, order: 1 });

module.exports = mongoose.model('ClientLogo', clientLogoSchema);
