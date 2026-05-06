interface CursorPayload {
  id: string;
  createdAt: string;
}

/**
 * Decode a base64 string into an object {_id: string, createdAt: Date}
 * @param {string} cursor - The base64 encoded cursor string
 * @return {{id: string, createdAt: Date}} - The decoded cursor object
 */
export function decodeCursor(cursor: string): { id: string; createdAt: Date } {
  const json = Buffer.from(cursor, "base64").toString("utf-8");
  const payload = JSON.parse(json) as CursorPayload;
  return {
    id: payload.id,
    createdAt: new Date(payload.createdAt),
  };
}
