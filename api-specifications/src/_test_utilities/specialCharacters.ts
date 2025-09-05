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

export function randomDigits(length: number): string {
  // Generates a string of random digits of specified length
  return Array.from({ length: length }, () => Math.floor(Math.random() * 10)).join(""); // NOSONAR
}

export function randomAlphaNum(length: number): string {
  // Generates a string of random alphanumeric characters of specified length
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: length }, () => chars[Math.floor(Math.random() * chars.length)]).join(""); // NOSONAR
}
