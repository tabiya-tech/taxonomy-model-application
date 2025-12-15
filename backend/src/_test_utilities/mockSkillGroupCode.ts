export function getMockRandomSkillCode() {
  const characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";

  // Generate a random alphabet character
  const randomChar = characters.charAt(Math.floor(Math.random() * characters.length)); // NOSONAR

  // prettier-ignore
  if (Math.random() < 0.5) { // NOSONAR
    return randomChar;
  }

  // Generate a random integer
  const randomInteger = digits.charAt(Math.floor(Math.random() * digits.length)); // NOSONAR

  // prettier-ignore
  if (Math.random() < 0.5) { // NOSONAR
        return randomChar + randomInteger;
    }

  const MAX_SIZE_RANDOM_LOOP = 1000;
  const n = Math.floor(Math.random() * MAX_SIZE_RANDOM_LOOP); // NOSONAR
  let currentCode = randomChar + randomInteger;
  for (let i = 0; i < n; i++) {
    currentCode += `.${digits.charAt(Math.floor(Math.random() * digits.length))}`; // NOSONAR
  }
  return currentCode;
}

export function getTestSkillGroupCode(levels: number = 256): string {
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
