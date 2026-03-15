/**
 * Encryption Utility — AES-256-GCM for credentials at rest
 *
 * Used to encrypt CRM API keys and secrets before storing in the
 * integrations table. Only Convex actions can access the master key
 * via process.env, so encrypt/decrypt must happen in the action layer.
 *
 * Format: base64(iv:ciphertext:authTag)
 * - IV: 12 bytes (96-bit, recommended for GCM)
 * - Auth tag: 16 bytes (128-bit)
 * - Key: 32 bytes (256-bit) from ENCRYPTION_MASTER_KEY env var
 */

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Get the master encryption key from environment.
 * Must be a 64-character hex string (32 bytes).
 * Only callable from Convex actions.
 */
function getMasterKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_MASTER_KEY;
  if (!keyHex) {
    throw new Error(
      "ENCRYPTION_MASTER_KEY not set. Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }
  if (keyHex.length !== KEY_LENGTH * 2) {
    throw new Error(
      `ENCRYPTION_MASTER_KEY must be ${KEY_LENGTH * 2} hex characters (${KEY_LENGTH} bytes). Got ${keyHex.length}.`
    );
  }
  return Buffer.from(keyHex, "hex");
}

/**
 * Encrypt a plaintext string.
 * Returns a base64-encoded string containing iv:ciphertext:authTag.
 */
export function encrypt(plaintext: string): string {
  const key = getMasterKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // Pack as iv:ciphertext:authTag
  const packed = Buffer.concat([iv, encrypted, authTag]);
  return packed.toString("base64");
}

/**
 * Decrypt a base64-encoded encrypted string.
 * Expects the format produced by encrypt().
 */
export function decrypt(encryptedBase64: string): string {
  const key = getMasterKey();
  const packed = Buffer.from(encryptedBase64, "base64");

  if (packed.length < IV_LENGTH + AUTH_TAG_LENGTH + 1) {
    throw new Error("Invalid encrypted data: too short");
  }

  const iv = packed.subarray(0, IV_LENGTH);
  const authTag = packed.subarray(packed.length - AUTH_TAG_LENGTH);
  const ciphertext = packed.subarray(IV_LENGTH, packed.length - AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

/**
 * Check if a string looks like it's already encrypted (base64-encoded, correct min length).
 * Used as a safety check to avoid double-encrypting.
 */
export function isEncrypted(value: string): boolean {
  if (!value || value.length < 40) return false;
  try {
    const decoded = Buffer.from(value, "base64");
    // Minimum: 12 (iv) + 1 (data) + 16 (tag) = 29 bytes
    return decoded.length >= IV_LENGTH + AUTH_TAG_LENGTH + 1;
  } catch {
    return false;
  }
}
