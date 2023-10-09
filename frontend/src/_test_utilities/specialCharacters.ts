const sampleValidSpecialCharacters = "^°!\"§$%&/()=?`´*+#'-_.,;<>öäü@[]{}|¡“¶¢[]≠¿'„…∞~<•±æœ";
const sampleInternationalCharacters = "αβγδεζηθικλμνξοπρστυφχψω";
const THREE_BYTE_UTF8_CHAR = "€";
export const WHITESPACE = " \n\r\t";

export function getTestString(length: number, prefix: string = ""): string {
  return (prefix + sampleValidSpecialCharacters + sampleInternationalCharacters)
    .slice(0, length)
    .padEnd(length, THREE_BYTE_UTF8_CHAR);
}

export function getRandomString(length: number) {
  let result = "";
  const characters = sampleValidSpecialCharacters + sampleInternationalCharacters;
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength)); // NOSONAR
    counter += 1;
  }
  return result;
}

export function getRandomLorem(length: number) {
  let result = "";
  const characters = "     abcdefghijklmnopqrstuvwxyz"; // 5 spaces for 20% chance of whitespace in the english language
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    const newChar = characters.charAt(Math.floor(Math.random() * charactersLength)); // NOSONAR
    if (!(newChar === " " && result.charAt(result.length))) {
      result += newChar;
      counter += 1;
    }
  }
  return result;
}
