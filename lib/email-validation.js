import { resolveMx } from 'node:dns/promises';

const disposableDomains = new Set([
  '10minutemail.com',
  'dispostable.com',
  'guerrillamail.com',
  'mailinator.com',
  'temp-mail.org',
  'tempmail.com',
  'trashmail.com',
  'yopmail.com',
]);

const blockedDomains = new Set([
  'example.com',
  'test.com',
  'localhost',
]);

const blockedLocalPatterns = [
  /^test(\d+)?$/i,
  /^demo(\d+)?$/i,
  /^example(\d+)?$/i,
  /^fake(\d+)?$/i,
  /^sample(\d+)?$/i,
  /^admin(\d+)?$/i,
  /^user(\d+)?$/i,
  /^qwerty/i,
  /^asdf/i,
];

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isValidEmailFormat(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isLikelyPlaceholderEmail(email) {
  const normalized = normalizeEmail(email);
  const [localPart = '', domain = ''] = normalized.split('@');
  if (!localPart || !domain) return true;

  if (blockedDomains.has(domain) || disposableDomains.has(domain)) {
    return true;
  }

  return blockedLocalPatterns.some((pattern) => pattern.test(localPart));
}

async function hasMxRecord(email) {
  const normalized = normalizeEmail(email);
  const domain = normalized.split('@')[1];
  if (!domain) return false;

  try {
    const records = await resolveMx(domain);
    return Array.isArray(records) && records.length > 0;
  } catch {
    return false;
  }
}

export async function validateSignupEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return { valid: false, email: normalized, error: 'Email is required' };
  }

  if (!isValidEmailFormat(normalized)) {
    return { valid: false, email: normalized, error: 'Invalid email format' };
  }

  if (isLikelyPlaceholderEmail(normalized)) {
    return {
      valid: false,
      email: normalized,
      error: 'Please use a real email address',
    };
  }

  const mxExists = await hasMxRecord(normalized);
  if (!mxExists) {
    return {
      valid: false,
      email: normalized,
      error: 'Email domain is not valid for receiving messages',
    };
  }

  return { valid: true, email: normalized };
}

