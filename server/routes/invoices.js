const express = require('express');
const router  = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/invoiceController');

// Client can view their own invoices; admin sees all
router.get('/',        authenticate, ctrl.getInvoices);
router.get('/stats',   authenticate, requireAdmin, ctrl.getStats);
router.get('/:id',     authenticate, ctrl.getInvoiceById);

// Admin only — create, update, send, delete
router.post('/',           authenticate, requireAdmin, ctrl.createInvoice);
router.patch('/:id',       authenticate, requireAdmin, ctrl.updateInvoice);
router.post('/:id/send',   authenticate, requireAdmin, ctrl.sendInvoice);
router.delete('/:id',      authenticate, requireAdmin, ctrl.deleteInvoice);

module.exports = router;
