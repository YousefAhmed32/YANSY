'use strict';

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;
  try {
    const nodemailer = require('nodemailer');
    if (!process.env.SMTP_HOST && !process.env.SMTP_SERVICE) {
      console.warn('[email] SMTP not configured. Emails will be logged to console only.');
      return null;
    }
    transporter = nodemailer.createTransport(
      process.env.SMTP_SERVICE
        ? {
            service: process.env.SMTP_SERVICE,
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          }
        : {
            host:   process.env.SMTP_HOST,
            port:   parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_PORT === '465',
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          }
    );
    return transporter;
  } catch (err) {
    console.warn('[email] nodemailer not installed. Run: npm install nodemailer');
    return null;
  }
};

const FROM_ADDRESS = `"YANSY" <${process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@yansytech.com'}>`;
const CLIENT_URL   = (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim();

// ── HTML email wrapper ────────────────────────────────────────────────────────

const emailWrapper = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>YANSY</title>
</head>
<body style="margin:0;padding:0;background:#080806;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#0d0d0b;border:1px solid rgba(212,175,55,0.15);border-radius:12px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding:28px 32px;border-bottom:1px solid rgba(212,175,55,0.1);">
              <span style="font-family:Georgia,serif;font-size:20px;font-weight:400;letter-spacing:0.25em;color:#d4af37;text-transform:uppercase;">YANSY</span>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:32px 32px 24px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.06);">
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.3);line-height:1.6;">
                © ${new Date().getFullYear()} YANSY. All rights reserved.<br/>
                You received this email because you have an account at <a href="${CLIENT_URL}" style="color:#d4af37;text-decoration:none;">YANSY</a>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const btnStyle = `display:inline-block;padding:12px 28px;background:#d4af37;color:#000000;font-size:12px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;text-decoration:none;border-radius:6px;`;
const h1Style  = `margin:0 0 16px;font-size:24px;font-weight:300;color:#f5f5f0;letter-spacing:-0.01em;`;
const pStyle   = `margin:0 0 20px;font-size:14px;color:rgba(255,255,255,0.6);line-height:1.7;`;

// ── Send helper ───────────────────────────────────────────────────────────────

const send = async ({ to, subject, html }) => {
  const t = getTransporter();
  if (!t) {
    console.log(`[email:DEV] To: ${to} | Subject: ${subject}`);
    return;
  }
  try {
    await t.sendMail({ from: FROM_ADDRESS, to, subject, html });
    console.log(`[email] Sent "${subject}" to ${to}`);
  } catch (err) {
    console.error(`[email] Failed to send "${subject}" to ${to}:`, err.message);
  }
};

// ── Transactional emails ──────────────────────────────────────────────────────

exports.sendEmailVerification = async (user, verificationToken) => {
  const firstName = user.fullName?.split(' ')[0] || 'there';
  const verifyUrl = `${CLIENT_URL}/verify-email?token=${verificationToken}`;
  await send({
    to: user.email,
    subject: 'Verify your YANSY email address',
    html: emailWrapper(`
      <h1 style="${h1Style}">Verify your email, ${firstName}.</h1>
      <p style="${pStyle}">Welcome to YANSY! Click the button below to verify your email address and activate your account. This link expires in <strong style="color:#d4af37;">24 hours</strong>.</p>
      <a href="${verifyUrl}" style="${btnStyle}">Verify Email Address</a>
      <p style="margin:24px 0 0;font-size:12px;color:rgba(255,255,255,0.3);">If you didn't create a YANSY account, you can safely ignore this email.</p>
    `),
  });
};

exports.sendWelcome = async (user) => {
  const firstName = user.fullName?.split(' ')[0] || 'there';
  await send({
    to: user.email,
    subject: 'Welcome to YANSY — Your workspace is ready',
    html: emailWrapper(`
      <h1 style="${h1Style}">Welcome, ${firstName}.</h1>
      <p style="${pStyle}">Your YANSY workspace is ready. Start by submitting your first project and our team will be in touch within 24 hours.</p>
      <a href="${CLIENT_URL}/app/projects/new" style="${btnStyle}">Create Your First Project</a>
    `),
  });
};

exports.sendPasswordReset = async (user, resetToken) => {
  const resetUrl = `${CLIENT_URL}/reset-password?token=${resetToken}`;
  await send({
    to: user.email,
    subject: 'Reset your YANSY password',
    html: emailWrapper(`
      <h1 style="${h1Style}">Password Reset</h1>
      <p style="${pStyle}">We received a request to reset the password for your YANSY account. Click the button below to choose a new password. This link expires in <strong style="color:#d4af37;">1 hour</strong>.</p>
      <a href="${resetUrl}" style="${btnStyle}">Reset Password</a>
      <p style="margin:24px 0 0;font-size:12px;color:rgba(255,255,255,0.3);">If you didn't request this, you can safely ignore this email. Your password won't change.</p>
    `),
  });
};

exports.sendProjectUpdate = async (user, project, updateTitle) => {
  await send({
    to: user.email,
    subject: `Project Update — ${project.title}`,
    html: emailWrapper(`
      <h1 style="${h1Style}">Your project was updated</h1>
      <p style="${pStyle}"><strong style="color:#f5f5f0;">${project.title}</strong> has a new update: <em>"${updateTitle}"</em>. Log in to see the full details and track your project progress.</p>
      <a href="${CLIENT_URL}/app/projects/${project._id}" style="${btnStyle}">View Project</a>
    `),
  });
};

exports.sendProjectStatusChange = async (user, project, newStatus) => {
  const statusLabels = {
    'in-progress':    'In Progress',
    'near-completion': 'Near Completion',
    delivered:         'Delivered',
    cancelled:         'Cancelled',
  };
  const label = statusLabels[newStatus] || newStatus;
  await send({
    to: user.email,
    subject: `Project Status — ${project.title} is now ${label}`,
    html: emailWrapper(`
      <h1 style="${h1Style}">${project.title}</h1>
      <p style="${pStyle}">Your project status has been updated to <strong style="color:#d4af37;">${label}</strong>. Log in to your dashboard to see the latest progress and any new updates from the team.</p>
      <a href="${CLIENT_URL}/app/projects/${project._id}" style="${btnStyle}">View Project</a>
    `),
  });
};

exports.sendNewMessage = async (user, senderName, projectTitle) => {
  await send({
    to: user.email,
    subject: `New message from ${senderName}`,
    html: emailWrapper(`
      <h1 style="${h1Style}">You have a new message</h1>
      <p style="${pStyle}"><strong style="color:#f5f5f0;">${senderName}</strong> sent you a message${projectTitle ? ` regarding <em>"${projectTitle}"</em>` : ''}. Log in to reply.</p>
      <a href="${CLIENT_URL}/app/messages" style="${btnStyle}">View Message</a>
    `),
  });
};

exports.sendAdminNewProjectRequest = async (adminEmail, clientName, projectTitle) => {
  await send({
    to: adminEmail,
    subject: `New Project Request — ${projectTitle}`,
    html: emailWrapper(`
      <h1 style="${h1Style}">New Project Request</h1>
      <p style="${pStyle}"><strong style="color:#f5f5f0;">${clientName}</strong> submitted a new project request: <em>"${projectTitle}"</em>. Review it in the admin panel.</p>
      <a href="${CLIENT_URL}/app/admin/project-requests" style="${btnStyle}">Review Request</a>
    `),
  });
};

exports.sendInvoice = async (user, invoice) => {
  const total = (invoice.total || 0).toLocaleString('en-US', { style: 'currency', currency: invoice.currency || 'USD' });
  await send({
    to: user.email,
    subject: `Invoice #${invoice.invoiceNumber} — ${total}`,
    html: emailWrapper(`
      <h1 style="${h1Style}">Invoice Ready</h1>
      <p style="${pStyle}">Invoice <strong style="color:#d4af37;">#${invoice.invoiceNumber}</strong> for <strong style="color:#f5f5f0;">${total}</strong> is ready for your review. Please pay by the due date to avoid any delays.</p>
      <a href="${CLIENT_URL}/app/invoices/${invoice._id}" style="${btnStyle}">View & Pay Invoice</a>
    `),
  });
};

exports.sendSubscriptionConfirmed = async (user, plan) => {
  await send({
    to: user.email,
    subject: `Your ${plan.displayName} subscription is active`,
    html: emailWrapper(`
      <h1 style="${h1Style}">Welcome to ${plan.displayName}</h1>
      <p style="${pStyle}">Your <strong style="color:#d4af37;">${plan.displayName}</strong> subscription is now active. You have full access to all included features.</p>
      <a href="${CLIENT_URL}/app/dashboard" style="${btnStyle}">Go to Dashboard</a>
    `),
  });
};

exports.sendSubscriptionCancelled = async (user, sub) => {
  const endDate = sub.currentPeriodEnd
    ? new Date(sub.currentPeriodEnd).toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'the end of your billing period';
  await send({
    to: user.email,
    subject: 'Your YANSY subscription has been cancelled',
    html: emailWrapper(`
      <h1 style="${h1Style}">Subscription Cancelled</h1>
      <p style="${pStyle}">Your subscription has been cancelled. You will retain access to your current features until <strong style="color:#f5f5f0;">${endDate}</strong>, after which your account will move to the Free plan.</p>
      <a href="${CLIENT_URL}/app/billing" style="${btnStyle}">Manage Billing</a>
    `),
  });
};

exports.sendPaymentFailed = async (user) => {
  await send({
    to: user.email,
    subject: 'Action required — payment failed',
    html: emailWrapper(`
      <h1 style="${h1Style}">Payment Failed</h1>
      <p style="${pStyle}">We were unable to process your subscription payment. Please update your payment method to avoid losing access to your account features.</p>
      <a href="${CLIENT_URL}/app/billing" style="${btnStyle}">Update Payment Method</a>
      <p style="margin:24px 0 0;font-size:12px;color:rgba(255,255,255,0.3);">If this was a mistake, your bank may have blocked the charge. Contact your bank or use a different card.</p>
    `),
  });
};

exports.sendTrialEndingEmail = async (user, sub) => {
  const endDate = sub.trialEndsAt
    ? new Date(sub.trialEndsAt).toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'soon';
  await send({
    to: user.email,
    subject: 'Your free trial ends in 3 days',
    html: emailWrapper(`
      <h1 style="${h1Style}">Your Trial Ends ${endDate}</h1>
      <p style="${pStyle}">Your free trial of the Professional plan ends in 3 days. Add a payment method now to continue enjoying all features without interruption.</p>
      <a href="${CLIENT_URL}/app/billing" style="${btnStyle}">Upgrade Now</a>
      <p style="margin:24px 0 0;font-size:12px;color:rgba(255,255,255,0.3);">If you choose not to upgrade, your account will automatically move to the Free plan. You won't lose any data.</p>
    `),
  });
};
