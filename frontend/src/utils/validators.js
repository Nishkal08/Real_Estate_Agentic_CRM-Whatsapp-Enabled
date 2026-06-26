/**
 * Validation utilities
 */

/**
 * Validate Indian mobile number.
 * Accepts: 9876543210 | +919876543210 | 919876543210
 */
export function validatePhone(phone) {
  if (!phone) return { valid: false, error: 'Phone number is required' };
  const cleaned = phone.replace(/[\s\-().+]/g, '');
  // Indian: starts with 91 + 10 digits OR 10 digits starting with 6-9
  const tenDigit = cleaned.replace(/^91/, '');
  if (!/^[6-9]\d{9}$/.test(tenDigit)) {
    return { valid: false, error: 'Enter a valid Indian mobile number' };
  }
  return { valid: true, e164: `+91${tenDigit}` };
}

/**
 * Convert phone to E.164 format
 */
export function toE164(phone) {
  if (!phone) return null;
  const cleaned = phone.replace(/[\s\-().+]/g, '');
  const tenDigit = cleaned.replace(/^91/, '');
  if (!/^[6-9]\d{9}$/.test(tenDigit)) return null;
  return `+91${tenDigit}`;
}

/**
 * Validate email address
 */
export function validateEmail(email) {
  if (!email) return { valid: false, error: 'Email is required' };
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) {
    return { valid: false, error: 'Enter a valid email address' };
  }
  return { valid: true };
}

/**
 * Validate required text field
 */
export function validateRequired(value, fieldName = 'This field') {
  if (!value || String(value).trim() === '') {
    return { valid: false, error: `${fieldName} is required` };
  }
  return { valid: true };
}

/**
 * Validate file type for uploads
 */
export function validateFileType(file, allowedTypes = []) {
  if (!file) return { valid: false, error: 'No file selected' };
  const ext = file.name.split('.').pop().toLowerCase();
  if (allowedTypes.length > 0 && !allowedTypes.includes(ext)) {
    return {
      valid: false,
      error: `Allowed types: ${allowedTypes.join(', ').toUpperCase()}`,
    };
  }
  return { valid: true };
}

/**
 * Validate file size
 */
export function validateFileSize(file, maxMB = 10) {
  if (!file) return { valid: false, error: 'No file selected' };
  const maxBytes = maxMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return { valid: false, error: `File must be under ${maxMB}MB` };
  }
  return { valid: true };
}
