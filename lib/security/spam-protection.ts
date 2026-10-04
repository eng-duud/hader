/**
 * Spam Defense & Rate Limiting Engine for Hader Contact Form
 *
 * Implements:
 * 1. Honeypot detection (invisible trap field)
 * 2. Minimum time-to-submit verification (blocks automated submission scripts < 3s)
 * 3. IP-based sliding window rate limiter (max 5 requests per hour per IP)
 * 4. Optional Cloudflare Turnstile verification
 */

interface RateLimitRecord {
  timestamps: number[];
}

// In-memory sliding window cache for IP rate limiting
const ipRateLimitStore = new Map<string, RateLimitRecord>();

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_WINDOW = 5;
const MINIMUM_SUBMISSION_TIME_MS = 3000; // 3 seconds

/**
 * Checks whether an IP has exceeded the hourly limit.
 * Cleans up expired timestamps on each check.
 */
export function checkIpRateLimit(ip: string): { allowed: boolean; remaining: number; resetInMs: number } {
  const now = Date.now();
  const record = ipRateLimitStore.get(ip) || { timestamps: [] };

  // Filter timestamps within the current sliding window
  const validTimestamps = record.timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);

  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldestTimestamp = validTimestamps[0];
    const resetInMs = RATE_LIMIT_WINDOW_MS - (now - oldestTimestamp);
    return {
      allowed: false,
      remaining: 0,
      resetInMs: Math.max(resetInMs, 0),
    };
  }

  // Record this attempt
  validTimestamps.push(now);
  ipRateLimitStore.set(ip, { timestamps: validTimestamps });

  return {
    allowed: true,
    remaining: MAX_REQUESTS_PER_WINDOW - validTimestamps.length,
    resetInMs: RATE_LIMIT_WINDOW_MS,
  };
}

/**
 * Resets rate limit for a specific IP (useful for automated testing)
 */
export function resetIpRateLimit(ip: string): void {
  ipRateLimitStore.delete(ip);
}

/**
 * Validates honeypot field.
 * Any value present in the hidden honeypot indicates a bot.
 */
export function isHoneypotTriggered(honeypotValue?: string | null): boolean {
  return typeof honeypotValue === 'string' && honeypotValue.trim().length > 0;
}

/**
 * Validates time-to-submit.
 * Humans require at least a few seconds to fill out the form.
 */
export function isSubmittedTooFast(loadedAtTimestamp?: number | null): boolean {
  if (!loadedAtTimestamp || isNaN(loadedAtTimestamp)) {
    // If no timestamp was passed or corrupted, flag as suspicious
    return true;
  }
  const elapsed = Date.now() - loadedAtTimestamp;
  return elapsed < MINIMUM_SUBMISSION_TIME_MS;
}

/**
 * Validates Cloudflare Turnstile token if configured in environment variables.
 * If Turnstile keys are not set, verification passes transparently.
 */
export async function verifyTurnstileToken(
  token?: string | null,
  remoteIp?: string
): Promise<{ success: boolean; error?: string }> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  // Turnstile is optional: skip if secret key is not configured
  if (!secretKey) {
    return { success: true };
  }

  if (!token) {
    return { success: false, error: 'Turnstile verification token is missing' };
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (remoteIp) {
      formData.append('remoteip', remoteIp);
    }

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
    });

    const result = await response.json();
    if (!result.success) {
      return {
        success: false,
        error: result['error-codes']?.join(', ') || 'Turnstile verification failed',
      };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Turnstile verification error:', err.message);
    // Don't fail the user if Cloudflare API is temporarily unreachable
    return { success: true };
  }
}
