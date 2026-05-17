/**
 * Chat Content Filter Service
 * 
 * Detects and blocks attempts to share direct contact information
 * in platform chat to prevent outside-platform deals.
 * 
 * 3-Layer Defense:
 * - Layer 1: Pattern matching (phone, email, social handles)
 * - Layer 2: Keyword detection (whatsapp, telegram, etc.)
 * - Layer 3: Obfuscation detection (w.h.a.t.s.a.p.p, wh@tsapp, etc.)
 */

export interface FilterResult {
  blocked: boolean;
  reason?: string;
  sanitizedContent?: string;
  detectedPatterns?: string[];
}

// Blocked keywords and their common obfuscations
const BLOCKED_KEYWORDS = [
  'whatsapp', 'whats app', 'watsapp', 'wtsapp', 'whtasapp',
  'telegram', 'telgram', 'tele gram',
  'instagram', 'insta gram', 'insta',
  'snapchat', 'snap chat',
  'discord', 'dis cord',
  'signal',
  'facebook', 'fb messenger',
  'skype',
  'wechat', 'we chat',
  'viber',
  'line app',
  'dm me', 'dm karo', 'dm kar',
  'personal number', 'personal mail',
  'mera number', 'mera mail', 'mera id',
  'call me on', 'call karo', 'msg karo',
  'contact me directly', 'direct contact',
  'bahar baat karte', 'platform ke bahar',
  'outside platform', 'off platform',
];

// Regex patterns for contact info detection
const PHONE_PATTERNS = [
  /\b\d{10,13}\b/,                           // Plain 10-13 digit numbers
  /\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/,         // Formatted: 123-456-7890
  /\b\+?\d{1,3}[-.\s]?\d{3,5}[-.\s]?\d{3,5}[-.\s]?\d{0,5}\b/, // International
  /\b\d{4}\s?\d{3}\s?\d{3}\b/,               // Indian format: 9876 543 210
];

const EMAIL_PATTERN = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/i;

// Social media handle pattern (@username)
const SOCIAL_HANDLE_PATTERN = /@[a-zA-Z0-9_.]{3,30}\b/;

// URL patterns (to catch personal links)
const PERSONAL_URL_PATTERNS = [
  /\b(t\.me\/\w+)\b/i,                        // Telegram links
  /\b(wa\.me\/\d+)\b/i,                        // WhatsApp links
  /\b(chat\.whatsapp\.com\/\w+)\b/i,           // WhatsApp group links
  /\b(instagram\.com\/\w+)\b/i,                // Instagram profiles
  /\b(fb\.com\/\w+)\b/i,                       // Facebook profiles
  /\b(discord\.gg\/\w+)\b/i,                   // Discord invites
];

/**
 * Normalize text for keyword matching
 * Handles common obfuscation techniques:
 * - Dots between letters: w.h.a.t.s.a.p.p → whatsapp
 * - Spaces between letters: w h a t s a p p → whatsapp
 * - Special chars: wh@tsapp → whatsapp
 * - Number substitution: 1nstagram → instagram
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    // Remove dots/dashes/underscores between single characters
    .replace(/(\w)[.\-_](?=\w)/g, '$1')
    // Remove excessive spaces between single characters (w h a t s a p p)
    .replace(/\b(\w)\s+(?=\w\b)/g, '$1')
    // Common character substitutions
    .replace(/@/g, 'a')
    .replace(/1/g, 'i')
    .replace(/0/g, 'o')
    .replace(/3/g, 'e')
    .replace(/\$/g, 's')
    .trim();
}

/**
 * Check message content for policy violations
 */
export function filterChatContent(content: string): FilterResult {
  const detectedPatterns: string[] = [];
  const normalizedContent = normalizeText(content);

  // 1. Check for phone numbers
  for (const pattern of PHONE_PATTERNS) {
    const match = content.match(pattern);
    if (match) {
      // Exclude common non-phone numbers (timestamps, order amounts, etc.)
      const number = match[0].replace(/[-.\s]/g, '');
      if (number.length >= 10 && !isLikelyNonPhone(content, match[0])) {
        detectedPatterns.push(`phone:${match[0]}`);
      }
    }
  }

  // 2. Check for email addresses
  const emailMatch = content.match(EMAIL_PATTERN);
  if (emailMatch) {
    detectedPatterns.push(`email:${emailMatch[0]}`);
  }

  // 3. Check for social media handles
  const handleMatch = content.match(SOCIAL_HANDLE_PATTERN);
  if (handleMatch) {
    // Exclude common in-context @mentions that might be order references
    const handle = handleMatch[0];
    if (!handle.startsWith('@order') && !handle.startsWith('@admin') && !handle.startsWith('@system')) {
      detectedPatterns.push(`handle:${handle}`);
    }
  }

  // 4. Check for blocked keywords (with obfuscation detection)
  for (const keyword of BLOCKED_KEYWORDS) {
    if (normalizedContent.includes(keyword.replace(/\s/g, ''))) {
      detectedPatterns.push(`keyword:${keyword}`);
      break; // One keyword match is enough
    }
  }

  // 5. Check for personal URL patterns
  for (const pattern of PERSONAL_URL_PATTERNS) {
    const match = content.match(pattern);
    if (match) {
      detectedPatterns.push(`url:${match[0]}`);
    }
  }

  // Decision: Block if any pattern detected
  if (detectedPatterns.length > 0) {
    return {
      blocked: true,
      reason: 'Direct contact sharing violates platform policy. All communication must happen through CreatorBridge to ensure payment protection and dispute resolution.',
      detectedPatterns,
    };
  }

  return { blocked: false };
}

/**
 * Heuristic to avoid false positives on numbers that aren't phone numbers.
 * Context-aware: Checks if the number is likely a price, timestamp, or order reference.
 */
function isLikelyNonPhone(fullText: string, matchedNumber: string): boolean {
  const contextWords = ['₹', '$', 'rs', 'inr', 'usd', 'seconds', 'minutes', 'hours',
    'revision', 'version', 'v', 'order', '#', 'fps', 'px', 'resolution', 'mb', 'gb',
    'kb', 'kbps', 'mbps', 'p', 'k', 'at', 'timestamp'];

  const idx = fullText.indexOf(matchedNumber);
  const surrounding = fullText.substring(Math.max(0, idx - 20), idx + matchedNumber.length + 20).toLowerCase();

  return contextWords.some(word => surrounding.includes(word));
}
