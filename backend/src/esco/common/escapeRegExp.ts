/**
 * Escapes the regular-expression special characters of a string so that it can be safely embedded in a
 * MongoDB `$regex` and matched literally. Used by the regex-based search of the entity list endpoints so that
 * a user-provided search value is treated as plain text (and cannot inject a costly or malicious pattern).
 *
 * @param {string} value - The raw string to escape.
 * @return {string} - The escaped string.
 */
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
