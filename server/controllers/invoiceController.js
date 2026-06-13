'use strict';
const Invoice = require('../models/Invoice');
const { audit } = require('../utils/auditLogger');
const emailService = require('../utils/emailService');
const { createNotification } = require('./notificationController');

// ── Create Invoice ────────────────────────────────────────────────────────────
exports.createInvoice = async (req, res, next) => {
  try {
    const { client, project, lineItems, taxRate, discount, currency, dueDate, notes } = req.body;

    if (!client || !lineItems?.length || !dueDate) {
      return res.status(400).json({ error: 'client, lineItems, and dueDate are required.' });
    }

    // Compute line item amounts
    const processedItems = lineItems.map(item => ({
      description: item.description,
      quantity:    item.quantity,
      unitPrice:   item.unitPrice,
      amount:      +(item.quantity * item.unitPrice).toFixed(2),
    }));

    const invoice = await Invoice.create({
      client,
      project: project || null,
      createdBy: req.user._id,
      lineItems: processedItems,
      taxRate:   taxRate  || 0,
      discount:  discount || 0,
      currency:  currency || 'USD',
      dueDate:   new Date(dueDate),
      notes:     notes    || '',
      status:    'draft',
    });

    const populated = await Invoice.findById(invoice._id)
      .populate('client',    'fullName email')
      .populate('project',   'title')
      .populate('createdBy', 'fullName');

    audit({ req, action: 'invoice.create', entityType: 'Invoice', entityId: invoice._id, after: { total: invoice.total, client } });

    res.status(201).json({ invoice: populated });
  } catch (error) {
    next(error);
  }
};

// ── Get All Invoices ──────────────────────────────────────────────────────────
exports.getInvoices = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, client } = req.query;
    const query = {};

    if (req.user.role === 'USER') {
      query.client = req.user._id;
    } else if (client) {
      query.client = client;
    }

    if (status) query.status = status;

    const [invoices, total] = await Promise.all([
      Invoice.find(query)
        .populate('client',  'fullName email')
        .populate('project', 'title')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit)),
      Invoice.countDocuments(query),
    ]);

    res.json({ invoices, total, totalPages: Math.ceil(total / parseInt(limit)), currentPage: parseInt(page) });
  } catch (error) {
    next(error);
  }
};

// ── Get Invoice by ID ─────────────────────────────────────────────────────────
exports.getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('client',    'fullName email phoneNumber companyName')
      .populate('project',   'title')
      .populate('createdBy', 'fullName');

    if (!invoice) return res.status(404).json({ error: 'Invoice not found.' });

    if (req.user.role === 'USER' && invoice.client._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    res.json({ invoice });
  } catch (error) {
    next(error);
  }
};

// ── Update Invoice ────────────────────────────────────────────────────────────
exports.updateInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found.' });

    if (invoice.status === 'paid') {
      return res.status(400).json({ error: 'Paid invoices cannot be modified.' });
    }

    const before = { status: invoice.status, total: invoice.total };
    const { lineItems, taxRate, discount, dueDate, notes, status } = req.body;

    if (lineItems) {
      invoice.lineItems = lineItems.map(item => ({
        description: item.description,
        quantity:    item.quantity,
        unitPrice:   item.unitPrice,
        amount:      +(item.quantity * item.unitPrice).toFixed(2),
      }));
    }
    if (taxRate  !== undefined) invoice.taxRate  = taxRate;
    if (discount !== undefined) invoice.discount = discount;
    if (dueDate)                invoice.dueDate  = new Date(dueDate);
    if (notes   !== undefined)  invoice.notes    = notes;
    if (status)                 invoice.status   = status;

    if (status === 'paid' && !invoice.paidAt) {
      invoice.paidAt = new Date();
    }

    await invoice.save();

    audit({ req, action: 'invoice.mark_paid', entityType: 'Invoice', entityId: invoice._id, before, after: { status: invoice.status, total: invoice.total } });

    const populated = await Invoice.findById(invoice._id)
      .populate('client',  'fullName email')
      .populate('project', 'title');

    res.json({ invoice: populated });
  } catch (error) {
    next(error);
  }
};

// ── Send Invoice to Client ────────────────────────────────────────────────────
exports.sendInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('client', 'fullName email');

    if (!invoice) return res.status(404).json({ error: 'Invoice not found.' });

    if (invoice.status === 'paid') {
      return res.status(400).json({ error: 'This invoice is already paid.' });
    }

    invoice.status = 'sent';
    invoice.sentAt = new Date();
    await invoice.save();

    // Send email
    setImmediate(async () => {
      try {
        await emailService.sendInvoice(invoice.client, invoice);
      } catch (err) {
        console.error('[invoice] Email send failed:', err.message);
      }
    });

    // In-app notification
    await createNotification({
      userId: invoice.client._id,
      type:   'alert',
      title:  `Invoice #${invoice.invoiceNumber} Ready`,
      message: `You have a new invoice for ${invoice.total} ${invoice.currency}. Please review and pay by ${new Date(invoice.dueDate).toLocaleDateString()}.`,
      link:   `/app/invoices/${invoice._id}`,
      refType: 'Invoice',
      refId:  invoice._id,
      io:     req.io,
    });

    audit({ req, action: 'invoice.send', entityType: 'Invoice', entityId: invoice._id });

    res.json({ invoice, message: 'Invoice sent successfully.' });
  } catch (error) {
    next(error);
  }
};

// ── Delete Invoice ────────────────────────────────────────────────────────────
exports.deleteInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found.' });

    if (invoice.status === 'paid') {
      return res.status(400).json({ error: 'Cannot delete a paid invoice.' });
    }

    await Invoice.findByIdAndDelete(req.params.id);
    audit({ req, action: 'invoice.delete', entityType: 'Invoice', entityId: req.params.id });

    res.json({ message: 'Invoice deleted.' });
  } catch (error) {
    next(error);
  }
};

// ── Invoice Stats (Admin) ─────────────────────────────────────────────────────
exports.getStats = async (req, res, next) => {
  try {
    const [total, paid, pending, overdue, revenue] = await Promise.all([
      Invoice.countDocuments(),
      Invoice.countDocuments({ status: 'paid' }),
      Invoice.countDocuments({ status: { $in: ['sent', 'draft'] } }),
      Invoice.countDocuments({ status: 'overdue' }),
      Invoice.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
    ]);

    res.json({
      total,
      paid,
      pending,
      overdue,
      totalRevenue: revenue[0]?.total || 0,
    });
  } catch (error) {
    next(error);
  }
};
