import crypto from 'crypto';

/**
 * Generates a strong random password that complies with specific security criteria.
 * @param length The desired length of the password. Must be at least 8.
 * @returns A string representing a strong password.
 */
export function generateStrongPassword(length: number = 16): string {
  if (length < 8) {
    throw new Error('Password length must be at least 8 characters.');
  }

  const lowerCase = "abcdefghijklmnopqrstuvwxyz";
  const upperCase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const specialChars = "!@#$%^&*()_+-=[]{}|;:',.<>?";
  const allChars = lowerCase + upperCase + numbers + specialChars;

  let password = "";
  // Pick one from each set to ensure each requirement is met
  password += pickRandomChar(lowerCase);
  password += pickRandomChar(upperCase);
  password += pickRandomChar(numbers);
  password += pickRandomChar(specialChars);

  // Fill the rest of the password length with random characters from all available characters
  for (let i = password.length; i < length; i++) {
    password += pickRandomChar(allChars);
  }

  // Shuffle the password to avoid predictable sequences (important if attackers know the generation strategy)
  return shuffle(password);
}

/**
 * Picks a random character from a given character set.
 * @param set The character set to pick from.
 * @returns A single character.
 */
function pickRandomChar(set: string): string {
  const randomIndex = crypto.randomInt(set.length);
  return set[randomIndex];
}

/**
 * Shuffles the characters in a string.
 * @param str The string to shuffle.
 * @returns A shuffled string.
 */
function shuffle(str: string): string {
  const array = str.split('');
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // Swap elements
  }
  return array.join('');
}
