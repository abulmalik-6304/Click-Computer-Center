// src/lib/password-utils.ts
// ═══════════════════════════════════════════════════════════════
// 🔐 PASSWORD UTILITIES
// - bcrypt hashing (12 rounds)
// - Password strength validation
// - Secure comparison
// ═══════════════════════════════════════════════════════════════

import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;

/**
 * Hash a plain password. Never store plain passwords.
 */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

/**
 * Compare plain password against stored hash.
 * Returns true if match.
 */
export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}

/**
 * Is this string a bcrypt hash? (starts with $2a$/$2b$/$2y$)
 */
export function isBcryptHash(value: string): boolean {
  return /^\$2[aby]\$\d{2}\$/.test(value);
}

// ─── Password strength rules ───

export interface PasswordStrength {
  valid: boolean;
  score: number; // 0-4 (weak → strong)
  checks: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    symbol: boolean;
  };
  message: string;
}

/**
 * Validate password strength.
 * Minimum for submission: score >= 2 (Medium) and length >= 8.
 */
export function checkPasswordStrength(password: string): PasswordStrength {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;
  const valid = checks.length && checks.lowercase && score >= 3;

  let message = "Very Weak";
  if (score === 3) message = "Weak";
  if (score === 4) message = "Good";
  if (score === 5) message = "Strong";

  if (!checks.length) {
    message = "Must be at least 8 characters";
  } else if (!valid) {
    message = "Add uppercase, number, or symbol";
  }

  return { valid, score, checks, message };
}
