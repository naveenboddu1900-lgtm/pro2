import { pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto";

const ITERATIONS = 120000;
const KEY_LENGTH = 64;
const DIGEST = "sha512";

export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");

  return `${ITERATIONS}:${salt}:${hash}`;
}

export function verifyPassword(password, storedHash) {
  const [iterations, salt, hash] = storedHash.split(":");
  const candidate = pbkdf2Sync(password, salt, Number(iterations), KEY_LENGTH, DIGEST);
  const expected = Buffer.from(hash, "hex");

  return expected.length === candidate.length && timingSafeEqual(expected, candidate);
}
