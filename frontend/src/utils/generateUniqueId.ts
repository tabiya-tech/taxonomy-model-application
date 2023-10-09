/**
 * Generate a unique id. Improve by using a better algorithm. e.g. incrementing a counter starting from a random number.
 * Or issuing a uuid
 *
 * @returns a unique id
 */
export const generateUniqueId = () => {
  return Math.random().toString(36).substring(2, 9);
};
