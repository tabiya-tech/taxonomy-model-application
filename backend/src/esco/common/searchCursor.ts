import { getFallbackLanguageConfig } from "common/language/fallbackLanguage";

/**
 * The cursor used to paginate a vector (embeddings) search.
 *
 * Unlike the keyset cursor used by the plain list and the regex search (which encodes the last item's id and
 * createdAt), a vector search is ordered by relevance to the query, which has no stable database sort key. It is
 * therefore paginated by rank offset: the cursor simply encodes how many of the ranked results have already been
 * returned. Because the query vector is deterministic, re-running the search and skipping `offset` results yields
 * the next page.
 *
 * The cursor also stores the language that was active when it was issued. If the client sends a cursor back with
 * a different language the rank ordering is no longer valid (it was computed for the previous language), so the
 * service should treat such a cursor as invalid.
 */
interface SearchCursorPayload {
  offset: number;
  language: string;
}

/**
 * Thrown by {@link decodeSearchCursor} when the cursor was issued for a different language than the one now
 * requested. The rank offset is valid but the result set would be from the wrong language, so callers should
 * reject the cursor and ask the client to start from page 1 in the new language.
 */
export class SearchCursorLanguageMismatchError extends Error {
  constructor(cursorLanguage: string, requestedLanguage: string) {
    super(
      `Search cursor was issued for language '${cursorLanguage}' but the current request uses '${requestedLanguage}'. ` +
        `Start a new search without a cursor to use the requested language.`
    );
    this.name = "SearchCursorLanguageMismatchError";
  }
}

/**
 * Encodes a vector-search pagination offset and language into an opaque base64 cursor string.
 *
 * @param {number} offset - The number of ranked results already returned.
 * @param {string} language - The language dbKeyName the search was executed in.
 * @return {string} - The base64 encoded cursor.
 */
export function encodeSearchCursor(offset: number, language: string): string {
  const payload: SearchCursorPayload = { offset, language };
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

/**
 * Parses an opaque base64 vector-search cursor, validating its structure.
 * Does NOT check the language — use this only for structural validation (e.g. to decide whether a cursor string
 * looks like a search cursor at all). Use {@link decodeSearchCursor} when you also need to enforce language.
 *
 * @param {string} cursor - The base64 encoded cursor.
 * @return {{ offset: number; language: string }} - The decoded payload.
 * @throws {Error} - If the cursor is malformed.
 */
export function parseSearchCursor(cursor: string): { offset: number; language: string } {
  const json = Buffer.from(cursor, "base64").toString("utf-8");
  const payload = JSON.parse(json) as SearchCursorPayload;
  if (typeof payload.offset !== "number" || !Number.isInteger(payload.offset) || payload.offset < 0) {
    throw new Error("Invalid search cursor: offset must be a non-negative integer");
  }
  // Cursors issued before language was added to the payload have no language field.
  // Treat a missing language as the fallback for one release cycle to avoid breaking
  // in-progress pagination sessions on deploy. An explicitly empty string is still invalid.
  if (typeof payload.language === "string" && payload.language.length === 0) {
    throw new Error("Invalid search cursor: language must be a non-empty string");
  }
  const language = typeof payload.language === "string" ? payload.language : getFallbackLanguageConfig().dbKeyName;
  return { offset: payload.offset, language };
}

/**
 * Decodes an opaque base64 vector-search cursor back into its pagination offset, validating both structure and
 * that the cursor language matches the currently requested language.
 *
 * @param {string} cursor - The base64 encoded cursor.
 * @param {string} requestedLanguage - The language dbKeyName of the current request.
 * @return {number} - The decoded, non-negative integer offset.
 * @throws {SearchCursorLanguageMismatchError} - If the cursor was issued for a different language.
 * @throws {Error} - If the cursor is malformed or does not hold a valid non-negative integer offset.
 */
export function decodeSearchCursor(cursor: string, requestedLanguage: string): number {
  const { offset, language } = parseSearchCursor(cursor);
  if (language !== requestedLanguage) {
    throw new SearchCursorLanguageMismatchError(language, requestedLanguage);
  }
  return offset;
}
