import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const digest = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${digest}`;
}

export function verifyPassword(password: string, storedHash: string | null | undefined) {
  if (!storedHash) {
    return false;
  }

  const [scheme, salt, digest] = storedHash.split(":");
  if (scheme !== "scrypt" || !salt || !digest) {
    return false;
  }

  const derived = scryptSync(password, salt, 64);
  const stored = Buffer.from(digest, "hex");
  return stored.length === derived.length && timingSafeEqual(stored, derived);
}
