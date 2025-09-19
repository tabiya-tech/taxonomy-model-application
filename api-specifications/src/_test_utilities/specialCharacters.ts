const sampleValidSpecialCharacters = "^°!\"§$%&/()=?`´*+#'-_.,;<>öäü@[]{}|¡“¶¢[]≠¿'„…∞~<•±æœ";
const sampleInternationalCharacters = "αβγδεζηθικλμνξοπρστυφχψω";
const THREE_BYTE_UTF8_CHAR = "€";
export const WHITESPACE = " \n\r\t";

export function getTestString(length: number, prefix: string = ""): string {
  return (prefix + sampleValidSpecialCharacters + sampleInternationalCharacters)
    .slice(0, length)
    .padEnd(length, THREE_BYTE_UTF8_CHAR);
}

/**
 * Returns a base64-encoded string of the specified length.
 * To get a base64 string of a given length, we first calculate the number of raw bytes needed.
 * Each 4 base64 characters represent 3 bytes of raw data, so we use (length / 4) * 3.
 * This ensures the output string is the requested length after base64 encoding.
 */
export function getTestBase64String(length: number): string {
  const rawLength = Math.floor(length / 4) * 3;
  return Buffer.from("a".repeat(rawLength)).toString("base64").slice(0, length);
}

export function getTestISCOGroupCode(length: number = 4): string {
  if (length < 1 || length > 4) {
    throw new Error("ISCO Group code length must be between 1 and 4");
  }
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join("");
}

export function getTestLocalGroupCode(
  prefixDigits: number = 0, // how many leading digits (0–4)
  letters: string = "ABC", // at least one letter is required
  suffixDigits: number = 0 // optional trailing digits
): string {
  if (prefixDigits < 0 || prefixDigits > 4) {
    throw new Error("Local group code prefixDigits must be between 0 and 4.");
  }
  const digits = Array.from({ length: prefixDigits }, () => Math.floor(Math.random() * 10)).join("");
  const suffix = Array.from({ length: suffixDigits }, () => Math.floor(Math.random() * 10)).join("");

  return `${digits}${letters}${suffix}`;
}

function randomDigits(length: number): string {
  // Generates a string of random digits of specified length
  return Array.from({ length: length }, () => Math.floor(Math.random() * 10)).join("");
}

function randomAlphaNum(length: number): string {
  // Generates a string of random alphanumeric characters of specified length
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

/**
 * Matches: ^\d{4}(?:\.\d+)+$
 * Examples: "1234.1", "1234.12.3"
 */

export function getTestESCOOccupationCode(opts?: {
  dotGroups?: number; // number of ".digits" groups (must be >=1)
  dotDigits?: number[]; // digits length for each dot group
}): string {
  const dotGroups = opts?.dotGroups ?? Math.floor(Math.random() * 3) + 1; // 1..3 by default
  const dotDigits = opts?.dotDigits ?? Array.from({ length: dotGroups }, () => Math.floor(Math.random() * 3) + 1); // each 1..3 digits

  if (dotGroups < 1) throw new Error("ESCO occupation code must have at least one .group");
  if (dotDigits.length !== dotGroups) throw new Error("dotDigits length must equal dotGroups");

  const prefix = randomDigits(4); // exactly 4 digits
  const dotParts = dotDigits.map((n) => `.${randomDigits(Math.max(1, n))}`).join("");
  return `${prefix}${dotParts}`;
}

/**
 * Matches: ^\d{4}(?:\.\d+)*(?:_\d+)+$
 * Examples: "1234_1", "1234.5_10", "1234.56.7_12", "1234.8_1_2"
 */

export function getTestESCOLocalOccupationCode(
  dotGroups: number = Math.floor(Math.random() * 3), // 0–2 dot groups
  underscoreGroups: number = Math.floor(Math.random() * 2) + 1 // 1–2 underscores
): string {
  const prefix = randomDigits(4);
  const dotPart = Array.from({ length: dotGroups }, () => `.${randomDigits(Math.floor(Math.random() * 3) + 1)}`).join(
    ""
  );
  const underscorePart = Array.from(
    { length: underscoreGroups },
    () => `_${randomDigits(Math.floor(Math.random() * 3) + 1)}`
  ).join("");
  return `${prefix}${dotPart}${underscorePart}`;
}

/**
 * Matches: (^[a-zA-Z\d]+)(?:_\d+)+$
 * Examples: "ABC_1", "ABC123_45", "1234_567", "ABC_1_2_3"
 */
export function getTestLocalOccupationCode(
  prefixLength: number = Math.floor(Math.random() * 4) + 1, // 1–4
  underscoreGroups: number = Math.floor(Math.random() * 2) + 1 // 1–2 underscores
): string {
  const prefix = randomAlphaNum(prefixLength);
  const underscorePart = Array.from(
    { length: underscoreGroups },
    () => `_${randomDigits(Math.floor(Math.random() * 3) + 1)}`
  ).join("");
  return `${prefix}${underscorePart}`;
}
