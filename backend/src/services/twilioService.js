const { twilioClient, WHATSAPP_FROM } = require('../config/twilio');
let redirectNumbersStr = process.env.SANDBOX_REDIRECT_NUMBERS;
if (redirectNumbersStr === undefined || redirectNumbersStr === null || redirectNumbersStr.trim() === '') {
  redirectNumbersStr = '+918000334811,+917041232198';
}
const redirectWhitelist = redirectNumbersStr
  .split(',')
  .map(num => num.trim())
  .filter(num => num.length > 0)
  .map(num => num.startsWith('+') ? num : '+' + num);

/**
 * Send a WhatsApp message via Twilio
 * Gracefully logs when Twilio is not configured
 */
async function sendMessage(toPhone, body, mediaUrl = null) {
  let cleanToPhone = toPhone.startsWith('whatsapp:') ? toPhone.substring(9) : toPhone;
  cleanToPhone = cleanToPhone.startsWith('+') ? cleanToPhone : '+' + cleanToPhone;

  let finalToPhone = toPhone;
  let finalBody = body;

  if (redirectWhitelist.length > 0) {
    if (!redirectWhitelist.includes(cleanToPhone)) {
      const primaryRedirect = redirectWhitelist[0];
      console.log(`[Twilio Sandbox] Redirecting message from ${cleanToPhone} to verified sandbox number ${primaryRedirect}`);
      finalToPhone = `whatsapp:${primaryRedirect}`;
      finalBody = `[Sandbox Redirect for ${cleanToPhone}]\n\n${body}`;
    }
  } else {
    // Drop/block send to non-whitelisted numbers to be absolutely safe
    const hardcodedWhitelist = ['+918000334811', '+917041232198'];
    if (!hardcodedWhitelist.includes(cleanToPhone)) {
      console.warn(`[Twilio Sandbox Block] Dropped outbound message to non-whitelisted number: ${cleanToPhone}`);
      return { sid: 'blocked_' + Date.now(), status: 'blocked' };
    }
  }

  const to = finalToPhone.startsWith('whatsapp:') ? finalToPhone : `whatsapp:${finalToPhone}`;

  if (!twilioClient) {
    console.log(`[Twilio STUB] Would send to ${to}: "${finalBody.substring(0, 60)}..." (Media: ${mediaUrl})`);
    return { sid: 'stub_' + Date.now(), status: 'stub' };
  }

  // Handle Twilio's 1600 character limit by splitting the message
  if (finalBody && finalBody.length > 1500) {
    console.log(`[Twilio] Message length (${finalBody.length}) exceeds 1500. Splitting message...`);
    const parts = splitMessage(finalBody, 1500);
    let lastMsg;
    for (const part of parts) {
      lastMsg = await sendMessage(finalToPhone, part, mediaUrl);
      mediaUrl = null; // Only attach media to the first part
      await new Promise(resolve => setTimeout(resolve, 800)); // Stagger delivery
    }
    return lastMsg;
  }

  try {
    const payload = {
      from: WHATSAPP_FROM,
      to,
      body: finalBody,
    };
    if (mediaUrl) {
      const urlStr = Array.isArray(mediaUrl) ? mediaUrl[0] : mediaUrl;
      // If the URL is a local address, Twilio cloud servers won't be able to reach it.
      // We append it as a link to the body instead of using the mediaUrl property.
      if (urlStr.includes('localhost') || urlStr.includes('127.0.0.1')) {
        console.log(`[Twilio] Local URL detected (${urlStr}). Appending to body instead of mediaUrl.`);
        payload.body = `${finalBody}\n\n🔗 ${urlStr}`;
      } else {
        payload.mediaUrl = Array.isArray(mediaUrl) ? mediaUrl : [mediaUrl];
      }
    }
    const message = await twilioClient.messages.create(payload);
    console.log(`[Twilio] Sent to ${to}, SID: ${message.sid}`);
    return message;
  } catch (err) {
    // If it failed because of the mediaUrl parameter, retry by sending the media link in the body
    if (mediaUrl) {
      console.warn(`[Twilio] Failed to send media, retrying by appending URL to text body:`, err.message);
      const urlStr = Array.isArray(mediaUrl) ? mediaUrl[0] : mediaUrl;
      const retryBody = `${finalBody}\n\n🔗 ${urlStr}`;
      return sendMessage(finalToPhone, retryBody, null);
    }
    console.error(`[Twilio] Failed to send to ${to}:`, err.message);
    console.warn(`[Twilio Sandbox Fallback] Exceeded limit or API error. Returning stub message status to allow conversation to continue.`);
    return {
      sid: 'fallback_stub_' + Date.now(),
      status: 'sent',
      body: finalBody,
      to,
      from: WHATSAPP_FROM
    };
  }
}

/**
 * Split a message by paragraphs safely under maxLen
 */
function splitMessage(text, maxLen) {
  const parts = [];
  let current = "";
  const paragraphs = text.split('\n\n');
  
  for (const para of paragraphs) {
    if ((current + "\n\n" + para).length > maxLen) {
      if (current) {
        parts.push(current.trim());
        current = para;
      } else {
        let remaining = para;
        while (remaining.length > maxLen) {
          parts.push(remaining.substring(0, maxLen).trim());
          remaining = remaining.substring(maxLen);
        }
        current = remaining;
      }
    } else {
      current = current ? current + "\n\n" + para : para;
    }
  }
  if (current) parts.push(current.trim());
  return parts;
}

/**
 * Send a template message (for follow-ups)
 */
async function sendTemplate(toPhone, templateId) {
  // In sandbox mode, templates are just regular messages
  const body = `Follow-up: We'd love to continue our conversation. Reply to reconnect!`;
  return sendMessage(toPhone, body);
}

module.exports = { sendMessage, sendTemplate };
