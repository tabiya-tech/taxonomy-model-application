/**
 * The cursor used to paginate a vector (embeddings) search.
 *
 * Unlike the keyset cursor used by the plain list and the regex search (which encodes the last item's id and
 * createdAt), a vector search is ordered by relevance to the query, which has no stable database sort key. It is
 * therefore paginated by rank offset: the cursor simply encodes how many of the ranked results have already been
 * returned. Because the query vector is deterministic, re-running the search and skipping `offset` results yields
 * the next page.
 */
interface SearchCursorPayload {
  offset: number;
}

/**
 * Encodes a vector-search pagination offset into an opaque base64 cursor string.
 *
 * @param {number} offset - The number of ranked results already returned.
 * @return {string} - The base64 encoded cursor.
 */
export function encodeSearchCursor(offset: number): string {
  const payload: SearchCursorPayload = { offset };
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

/**
 * Decodes an opaque base64 vector-search cursor back into its pagination offset.
 *
 * @param {string} cursor - The base64 encoded cursor.
 * @return {number} - The decoded, non-negative integer offset.
 * @throws {Error} - If the cursor is malformed or does not hold a valid non-negative integer offset.
 */
export function decodeSearchCursor(cursor: string): number {
  const json = Buffer.from(cursor, "base64").toString("utf-8");
  const payload = JSON.parse(json) as SearchCursorPayload;
  if (typeof payload.offset !== "number" || !Number.isInteger(payload.offset) || payload.offset < 0) {
    throw new Error("Invalid search cursor: offset must be a non-negative integer");
  }
  return payload.offset;
}
