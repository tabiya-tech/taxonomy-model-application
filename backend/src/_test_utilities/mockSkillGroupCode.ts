export function getMockRandomSkillCode() {
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';

  // Generate a random alphabet character
  const randomChar = characters.charAt(Math.floor(Math.random() * characters.length));

  if (Math.random() < 0.5) { // NOSONAR
    return randomChar;
  }

  // Generate a random integer
  const randomInteger = digits.charAt(Math.floor(Math.random() * digits.length)); // NOSONAR

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