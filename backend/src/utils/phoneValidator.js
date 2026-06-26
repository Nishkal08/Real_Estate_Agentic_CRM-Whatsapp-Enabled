/**
 * Indian phone number normalization + validation
 * Converts various formats to E.164: +91XXXXXXXXXX
 */

const INDIAN_REGEX = /^(?:\+?91|0)?([6-9]\d{9})$/;

/**
 * Normalize a phone string to +91XXXXXXXXXX
 * Returns null if invalid
 */
function normalizePhone(raw) {
  if (!raw) return null;
  const cleaned = String(raw).replace(/[\s\-().]/g, '');
  const match = cleaned.match(INDIAN_REGEX);
  if (match) return `+91${match[1]}`;
  
  if (/^\+[1-9]\d{1,14}$/.test(cleaned)) return cleaned;
  
  // If Excel stripped the '+', it will be just digits. If it's 10-15 digits long, prepend '+'.
  if (/^[1-9]\d{9,14}$/.test(cleaned)) return `+${cleaned}`;
  
  return null;
}

/**
 * Check if a phone string is a valid Indian mobile number
 */
function isValidIndianPhone(phone) {
  if (!phone) return false;
  return /^\+91[6-9]\d{9}$/.test(phone);
}

module.exports = { normalizePhone, isValidIndianPhone };
