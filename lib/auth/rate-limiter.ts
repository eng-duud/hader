interface RateLimitRecord {
  attempts: number;
  resetAt: number;
}

// In-memory rate limiting store for login attempts
// Keyed by IP or IP+email identifier
const loginAttempts = new Map<string, RateLimitRecord>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterSeconds?: number;
}

export function checkLoginRateLimit(identifier: string): RateLimitResult {
  const now = Date.now();
  const record = loginAttempts.get(identifier);

  if (!record) {
    return {
      allowed: true,
      remainingAttempts: MAX_ATTEMPTS,
    };
  }

  // Window expired, reset
  if (now > record.resetAt) {
    loginAttempts.delete(identifier);
    return {
      allowed: true,
      remainingAttempts: MAX_ATTEMPTS,
    };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterSeconds,
    };
  }

  return {
    allowed: true,
    remainingAttempts: MAX_ATTEMPTS - record.attempts,
  };
}

export function recordFailedLoginAttempt(identifier: string): RateLimitResult {
  const now = Date.now();
  const record = loginAttempts.get(identifier);

  if (!record || now > record.resetAt) {
    const newRecord: RateLimitRecord = {
      attempts: 1,
      resetAt: now + WINDOW_MS,
    };
    loginAttempts.set(identifier, newRecord);
    return {
      allowed: true,
      remainingAttempts: MAX_ATTEMPTS - 1,
    };
  }

  record.attempts += 1;
  loginAttempts.set(identifier, record);

  const allowed = record.attempts < MAX_ATTEMPTS;
  const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);

  return {
    allowed,
    remainingAttempts: Math.max(0, MAX_ATTEMPTS - record.attempts),
    retryAfterSeconds: allowed ? undefined : retryAfterSeconds,
  };
}

export function resetLoginAttempts(identifier: string): void {
  loginAttempts.delete(identifier);
}
