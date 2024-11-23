const sampleValidSpecialCharacters = "^°!\"§$%&/()=?`´*+#'-_.,;<>öäü@[]{}|¡“¶¢[]≠¿'„…∞~<•±æœ";
const sampleInternationCharacters = "αβγδεζηθικλμνξοπρστυφχψω";
const THREE_BYTE_UTF8_CHAR = "€";
export const WHITESPACE = " \n\r\t";

export function getTestString(length: number, prefix: string = ""): string {
  return (prefix + sampleValidSpecialCharacters + sampleInternationCharacters)
    .slice(0, length)
    .padEnd(length, THREE_BYTE_UTF8_CHAR);
}

export function get3ByteTestString(length: number, prefix: string = ""): string {
  return prefix + THREE_BYTE_UTF8_CHAR.repeat(length - prefix.length);
}

export function getRandomString(length: number) {
  let result = "";
  const characters = sampleValidSpecialCharacters + sampleInternationCharacters + WHITESPACE;
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength)); // NOSONAR
    counter += 1;
  }
  return result;
}

export function getRandomBoolean() {
  return Math.random() > 0.5; // NOSONAR
}

export function generateRandomUrl() {
  const letters = "abcdefghijklmnopqrstuvwxyz";
  const tlds = [".com", ".net", ".org", ".io"]; // List of top-level domains

  // Generate a random string of letters for the domain name
  let domain = "";
  for (let i = 0; i < 10; i++) {
    const randomIndex = Math.floor(Math.random() * letters.length); // NOSONAR
    domain += letters[randomIndex];
  }

  // Pick a random top-level domain from the list
  const randomTldIndex = Math.floor(Math.random() * tlds.length); // NOSONAR
  const tld = tlds[randomTldIndex];

  // Generate a random path with 1 to 3 segments
  const segments = Math.floor(Math.random() * 3) + 1; // NOSONAR
  let path = "";
  for (let i = 0; i < segments; i++) {
    const randomSegment = Math.random().toString(36).slice(2, 10); // NOSONAR
    path += "/" + randomSegment;
  }
  const protocols = ["", "https://", "http://www.", "http://", "http://www."]; // NOSONAR
  const protocol = protocols[Math.floor(Math.random() * protocols.length)]; // NOSONAR

  return protocol + domain + tld + path;
}

export function generateRandomDigitString(minDigits: number, maxDigits: number): string {
  let result = "";
  const characters = "0123456789";
  const digitCount = Math.floor(Math.random() * (maxDigits - minDigits + 1)) + minDigits; // NOSONAR
  const charactersLength = characters.length;

  for (let i = 0; i < digitCount; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength)); // NOSONAR
  }
  return result;
}

export function generateRandomAlphabeticalString(minDigits: number, maxDigits: number) {
  let result = "";
  const characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digitCount = Math.floor(Math.random() * (maxDigits - minDigits + 1)) + minDigits; // NOSONAR
  const charactersLength = characters.length;

  for (let i = 0; i < digitCount; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength)); // NOSONAR
  }
  return result;
}

export function generateRandomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min; // NOSONAR
}
