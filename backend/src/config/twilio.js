/**
 * Twilio client — gracefully skips when credentials are missing
 */

let twilioClient = null;
const WHATSAPP_FROM = process.env.TWILIO_NUMBER ? `whatsapp:${process.env.TWILIO_NUMBER}` : 'whatsapp:+14155238886';

if (process.env.TWILIO_SSID && process.env.TWILIO_AUTH) {
  const twilio = require('twilio');
  twilioClient = twilio(process.env.TWILIO_SSID, process.env.TWILIO_AUTH);
  console.log('[Twilio] Client initialized');
} else {
  console.warn('[Twilio] Credentials not set — WhatsApp sending will be stubbed');
}

module.exports = { twilioClient, WHATSAPP_FROM };
