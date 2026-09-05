'use strict';
const crypto = require('crypto');
const Proposal = require('../../models/proposals/Proposal');
const Project = require('../../models/Project');
const Invoice = require('../../models/Invoice');
const User = require('../../models/User');
const { createNotification } = require('../../controllers/notificationController');

/**
 * Automatically converts an ACCEPTED proposal into an active Project
 * and issues Invoice #1 (Downpayment / Milestone 1 deposit).
 */
exports.convertAcceptedProposal = async (proposalId, { io } = {}) => {
  try {
    const proposal = await Proposal.findById(proposalId).populate('client');
    if (!proposal) {
      throw new Error(`Proposal ${proposalId} not found`);
    }

    // Idempotent: If already converted, return existing records
    if (proposal.convertedProjectId && proposal.convertedInvoiceId) {
      const [existingProject, existingInvoice] = await Promise.all([
        Project.findById(proposal.convertedProjectId),
        Invoice.findById(proposal.convertedInvoiceId),
      ]);
      return { project: existingProject, invoice: existingInvoice, alreadyConverted: true };
    }

    const clientData = proposal.client || {};
    const clientEmail = (clientData.email || proposal.clientResponse?.email || '').toLowerCase().trim();

    // 1. Locate or create client User account
    let clientUser = null;
    if (clientEmail) {
      clientUser = await User.findOne({ email: clientEmail });
      if (!clientUser) {
        const tempPassword = crypto.randomBytes(8).toString('hex') + 'Aa1!';
        clientUser = await User.create({
          fullName: clientData.name || proposal.clientResponse?.name || clientData.company || 'Client',
          email: clientEmail,
          password: tempPassword,
          phoneNumber: clientData.phone || clientData.whatsapp || '',
          role: 'CLIENT',
          companyName: clientData.company || '',
        });
      }
    }

    const clientUserId = clientUser ? clientUser._id : (proposal.createdBy || null);

    // 2. Map Milestones from Proposal pricing or default phases
    let milestones = [];
    if (proposal.pricing?.milestones && proposal.pricing.milestones.length > 0) {
      milestones = proposal.pricing.milestones.map((m, idx) => ({
        title:       m.title || `Phase ${idx + 1}`,
        description: m.description || '',
        amount:      Number(m.amount) || 0,
        status:      idx === 0 ? 'in_progress' : 'pending',
        dueDate:     m.dueDate || (proposal.project?.startDate
          ? new Date(new Date(proposal.project.startDate).getTime() + (idx + 1) * 14 * 86400000)
          : undefined),
      }));
    } else {
      milestones = [
        { title: 'Planning & Product Architecture', status: 'in_progress' },
        { title: 'UI/UX Design & Prototyping',     status: 'pending' },
        { title: 'Core Development & Integrations',  status: 'pending' },
        { title: 'QA, Staging & Launch Handover',    status: 'pending' },
      ];
    }

    const finalPrice = Number(proposal.pricing?.finalPrice || proposal.pricing?.total || 0);
    const currency   = proposal.pricing?.currency || 'USD';

    // 3. Create the Project
    const project = await Project.create({
      title:        proposal.project?.title || `Project — ${proposal.proposalNumber}`,
      description:  proposal.project?.description || proposal.project?.overview || `Project delivered under proposal ${proposal.proposalNumber}`,
      client:       clientUserId,
      proposalId:   proposal._id,
      budget:       `${finalPrice.toLocaleString()} ${currency}`,
      budgetAmount: finalPrice,
      currency,
      clientType:   clientData.company ? 'company' : 'individual',
      companyName:  clientData.company || undefined,
      phase:        'planning',
      status:       'pending',
      progress:     0,
      milestones,
    });

    // 4. Determine Deposit Invoice #1 amount
    let depositAmount = 0;
    if (milestones[0]?.amount && milestones[0].amount > 0) {
      depositAmount = milestones[0].amount;
    } else if (finalPrice > 0) {
      depositAmount = +(finalPrice * 0.3).toFixed(2); // 30% standard deposit
    } else {
      depositAmount = 0;
    }

    // 5. Create Invoice #1
    let invoice = null;
    if (depositAmount > 0 && clientUserId) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7); // Net 7 days for deposit

      const adminUser = proposal.createdBy || clientUserId;

      invoice = await Invoice.create({
        client:    clientUserId,
        project:   project._id,
        createdBy: adminUser,
        lineItems: [
          {
            description: `Project Kickoff Downpayment (Deposit) — ${project.title}`,
            quantity: 1,
            unitPrice: depositAmount,
            amount: depositAmount,
          }
        ],
        subtotal: depositAmount,
        total:    depositAmount,
        currency,
        status:   'sent',
        dueDate,
        notes:    `Automated kickoff deposit for accepted proposal ${proposal.proposalNumber}.`,
      });
    }

    // 6. Link created records back to Proposal
    proposal.convertedProjectId = project._id;
    if (invoice) {
      proposal.convertedInvoiceId = invoice._id;
    }
    await proposal.save();

    // 7. Dispatch Notifications
    try {
      const admins = await User.find({ role: { $in: ['ADMIN', 'SUPER_ADMIN'] } }).select('_id');
      admins.forEach(admin => {
        createNotification({
          userId: admin._id,
          type: 'alert',
          title: 'Proposal Converted to Project',
          message: `Proposal ${proposal.proposalNumber} was accepted and converted into Project "${project.title}".`,
          link: '/app/admin/projects',
          priority: 'high',
          io,
        });
      });
    } catch (notifErr) {
      console.error('[Proposal Conversion] Notification error:', notifErr.message);
    }

    return { project, invoice, alreadyConverted: false };
  } catch (err) {
    console.error('[Proposal Conversion] Error converting proposal:', err);
    throw err;
  }
};
