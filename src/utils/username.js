import { User } from "../models/User.js";
import { USERNAME_COLLATION } from "./usernameCollation.js";

export const hashEmailDjb2 = (email) => {
  let hash = 5381;
  for (const character of email.toLowerCase()) {
    hash = Math.imul(hash, 33) ^ character.charCodeAt(0);
  }
  return (hash >>> 0) % 10;
};

export const hashEmailSdbm = (email) => {
  let hash = 0;
  for (const character of email.toLowerCase()) {
    const code = character.charCodeAt(0);
    hash = code + (hash << 6) + (hash << 16) - hash;
  }
  return (hash >>> 0) % 10;
};

export const hashEmailFnv1a = (email) => {
  let hash = 2166136261;
  for (const character of email.toLowerCase()) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % 10;
};

export const hashEmailPolynomial = (email) => {
  let hash = 7;
  for (const character of email.toLowerCase()) {
    hash = Math.imul(hash, 31) + character.charCodeAt(0);
  }
  return (hash >>> 0) % 10;
};

const makeUsernameBase = (displayName, email) => {
  const candidate = (displayName || email.split("@")[0])
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 20);

  return candidate.length >= 2 ? candidate : "chef";
};

const makeEmailSuffix = (email, attempt) => {
  const hashInput = attempt === 0 ? email : `${email}#${attempt}`;
  return [
    hashEmailDjb2(hashInput),
    hashEmailSdbm(hashInput),
    hashEmailFnv1a(hashInput),
    hashEmailPolynomial(hashInput),
  ].join("");
};

export const findAvailableUsername = async ({
  displayName,
  email,
  excludeUserId,
}) => {
  const base = makeUsernameBase(displayName, email);

  for (let attempt = 0; attempt < 10_000; attempt += 1) {
    const username = `${base}${makeEmailSuffix(email, attempt)}`;
    const query = { username };

    if (excludeUserId) {
      query._id = { $ne: excludeUserId };
    }

    const existingUser = await User.exists(query).collation(USERNAME_COLLATION);
    if (!existingUser) return username;
  }

  throw new Error("Unable to create a unique username for this account.");
};

export const isDuplicateUsernameError = (error) =>
  error?.code === 11000 &&
  (error.keyPattern?.username === 1 ||
    error.message?.includes("username_unique_ci"));

export { USERNAME_COLLATION };
