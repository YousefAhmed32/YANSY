const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema({
  description: { type: String, required: true, trim: true },
  quantity:    { type: Number, required: true, min: 0.01 },
  unitPrice:   { type: Number, required: true, min: 0 },
  amount:      { type: Number, required: true, min: 0 },
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    unique: true,
    required: true,
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  lineItems: [lineItemSchema],

  subtotal: { type: Number, required: true, min: 0 },
  taxRate:  { type: Number, default: 0, min: 0, max: 100 },
  taxAmount:{ type: Number, default: 0, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  total:    { type: Number, required: true, min: 0 },

  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'SAR', 'AED', 'EGP', 'GBP', 'KWD', 'QAR'],
  },

  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled', 'partially_paid'],
    default: 'draft',
  },

  dueDate: { type: Date, required: true },
  sentAt:  { type: Date, default: null },
  paidAt:  { type: Date, default: null },

  notes: { type: String, trim: true, default: '' },

  // Payment info
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'stripe', 'cash', 'mada', 'stc_pay', 'other', null],
    default: null,
  },
  stripePaymentIntentId: { type: String, default: null },
  amountPaid:            { type: Number, default: 0 },
}, {
  timestamps: true,
});

// Auto-generate invoice number
invoiceSchema.pre('validate', async function () {
  if (!this.invoiceNumber) {
    const count = await mongoose.model('Invoice').countDocuments();
    this.invoiceNumber = `INV-${String(count + 1).padStart(5, '0')}`;
  }
});

// Compute totals before saving
invoiceSchema.pre('save', function () {
  this.subtotal  = this.lineItems.reduce((sum, item) => sum + item.amount, 0);
  this.taxAmount = +(this.subtotal * (this.taxRate / 100)).toFixed(2);
  this.total     = +(this.subtotal + this.taxAmount - this.discount).toFixed(2);
});

invoiceSchema.index({ client: 1, status: 1 });
invoiceSchema.index({ status: 1, dueDate: 1 });
invoiceSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
