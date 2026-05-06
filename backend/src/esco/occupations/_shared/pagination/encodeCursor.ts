/**
 * Encode an object {_id: string, createdAt: Date} into a base64 string
 * @param {string} id - The Document id to encode
 * @param {Date} createdAt - The Document createdAt date to encode
 * @return {string} - The base64 encoded string
 */
export function encodeCursor(id: string, createdAt: Date): string {
  const payload = {
    id: id,
    createdAt: createdAt.toISOString(),
  };
  const json = JSON.stringify(payload);
  return Buffer.from(json).toString("base64");
}
