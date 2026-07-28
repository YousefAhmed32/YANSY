'use strict';

/**
 * Meta Conversions API (server-side event tracking).
 *
 * Complements the browser Pixel: sends the same standard events
 * (Lead, Contact, CompleteRegistration, Purchase, ...) directly from the
 * backend, so conversions still get attributed when ad blockers, Safari
 * ITP, or iOS 14.5+ App Tracking Transparency strip the client-side pixel.
 *
 * Fully inert until META_PIXEL_ID + META_CAPI_ACCESS_TOKEN are set in the
 * environment — every call below no-ops (resolves immediately, never
 * throws) so nothing breaks or slows down a request while these are unset.
 * Get both from Meta Events Manager → your Pixel → Settings → Conversions API.
 */

const axios = require('axios');
const crypto = require('crypto');

const PIXEL_ID     = process.env.META_PIXEL_ID;
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
const API_VERSION  = 'v21.0';

const isConfigured = () => Boolean(PIXEL_ID && ACCESS_TOKEN);

// Meta requires PII match keys (em, ph) to be lowercased/trimmed then SHA-256 hashed.
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

const hashEmail = (email) => (email ? sha256(email.trim().toLowerCase()) : undefined);
const hashPhone = (phone) => (phone ? sha256(phone.replace(/[^\d]/g, '')) : undefined);

/**
 * Send one server-side event.
 * @param {string} eventName - Standard Meta event name (Lead, Contact, CompleteRegistration, Purchase, Schedule, ViewContent, InitiateCheckout, ...)
 * @param {import('express').Request} req - Express request (for IP/user-agent/fbp/fbc match keys)
 * @param {{ email?: string, phone?: string }} identity - Raw (unhashed) PII — hashed here before it ever leaves this function
 * @param {object} customData - Event-specific data (value, currency, content_name, ...)
 */
const sendServerEvent = async (eventName, req, identity = {}, customData = {}) => {
  if (!isConfigured()) return;

  try {
    const userData = {
      client_ip_address: req?.ip,
      client_user_agent: req?.headers?.['user-agent'],
      em: hashEmail(identity.email),
      ph: hashPhone(identity.phone),
      fbp: req?.cookies?._fbp,
      fbc: req?.cookies?._fbc,
    };
    // Strip undefined keys — Meta rejects unexpected null/undefined fields in some SDKs.
    Object.keys(userData).forEach((k) => userData[k] === undefined && delete userData[k]);

    await axios.post(
      `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events`,
      {
        data: [{
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          action_source: 'website',
          event_source_url: req?.headers?.referer,
          user_data: userData,
          custom_data: customData,
        }],
      },
      { params: { access_token: ACCESS_TOKEN }, timeout: 5000 }
    );
  } catch (err) {
    // Never let a tracking failure affect the actual request/response.
    console.error('[metaConversionsApi] Failed to send event:', eventName, err.response?.data?.error?.message || err.message);
  }
};

module.exports = { sendServerEvent, isConfigured };
