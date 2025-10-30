import { randomAlphaNum, randomDigits } from "../../_test_utilities/specialCharacters";

export function getTestISCOGroupCode(length: number = 4): string {
  if (length < 1 || length > 4) {
    throw new Error("ISCO Group code length must be between 1 and 4");
  }
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join(""); // NOSONAR
}

export function getTestLocalGroupCode(
  prefixDigits: number = 0, // how many leading digits (0–4)
  letters: string = "ABC", // at least one letter is required
  suffixDigits: number = 0 // optional trailing digits
): string {
  if (prefixDigits < 0 || prefixDigits > 4) {
    throw new Error("Local group code prefixDigits must be between 0 and 4.");
  }
  const digits = Array.from({ length: prefixDigits }, () => Math.floor(Math.random() * 10)).join(""); // NOSONAR
  const suffix = Array.from({ length: suffixDigits }, () => Math.floor(Math.random() * 10)).join(""); // NOSONAR

  return `${digits}${letters}${suffix}`;
}

/**
 * Matches: ^\d{4}(?:\.\d+)+$
 * Examples: "1234.1", "1234.12.3"
 */

export function getTestESCOOccupationCode(opts?: {
  dotGroups?: number; // number of ".digits" groups (must be >=1)
  dotDigits?: number[]; // digits length for each dot group
}): string {
  const dotGroups = opts?.dotGroups ?? Math.floor(Math.random() * 3) + 1; // 1..3 by default // NOSONAR
  const dotDigits = opts?.dotDigits ?? Array.from({ length: dotGroups }, () => Math.floor(Math.random() * 3) + 1); // each 1..3 digits // NOSONAR

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
  dotGroups: number = Math.floor(Math.random() * 3), // 0–2 dot groups // NOSONAR
  underscoreGroups: number = Math.floor(Math.random() * 2) + 1 // 1–2 underscores // NOSONAR
): string {
  const prefix = randomDigits(4);
  const dotPart = Array.from({ length: dotGroups }, () => `.${randomDigits(Math.floor(Math.random() * 3) + 1)}`).join(
    // NOSONAR
    ""
  );
  const underscorePart = Array.from(
    { length: underscoreGroups },
    () => `_${randomDigits(Math.floor(Math.random() * 3) + 1)}` // NOSONAR
  ).join("");
  return `${prefix}${dotPart}${underscorePart}`;
}

/**
 * Matches: (^[a-zA-Z\d]+)(?:_\d+)+$
 * Examples: "ABC_1", "ABC123_45", "1234_567", "ABC_1_2_3"
 */
export function getTestLocalOccupationCode(
  prefixLength: number = Math.floor(Math.random() * 4) + 1, // 1–4 // NOSONAR
  underscoreGroups: number = Math.floor(Math.random() * 2) + 1 // 1–2 underscores // NOSONAR
): string {
  const prefix = randomAlphaNum(prefixLength);
  const underscorePart = Array.from(
    { length: underscoreGroups },
    () => `_${randomDigits(Math.floor(Math.random() * 3) + 1)}` // NOSONAR
  ).join("");
  return `${prefix}${underscorePart}`;
}

/**
 * Matches: ^([a-zA-Z]\\d+(\\.\\d+)*|[a-zA-Z])$
 * Examples: "G7", "x4.7.6", "y7.4.7.7.5.1.2.1.6", "J9.7"
 */
export function getTestSkillGroupCode(levels: number = 100): string {
  if (levels < 1) {
    throw new Error("Skill group code must have at least 1 level");
  }

  // Start with a random letter (upper or lower case)
  const letter = String.fromCharCode(
    Math.random() < 0.5
      ? 65 + Math.floor(Math.random() * 26) // 'A'-'Z'
      : 97 + Math.floor(Math.random() * 26) // 'a'-'z'
  );

  // Generate groups like: 9, 3.5, 8.2.1 etc.
  const groups =
    levels === 1
      ? "" // just a letter, e.g. "L"
      : Array.from({ length: levels - 1 })
          .map(() => Math.floor(Math.random() * 10).toString()) // single digit per group
          .join(".");

  const code = groups ? `${letter}${groups}` : letter;

  return code;
}
