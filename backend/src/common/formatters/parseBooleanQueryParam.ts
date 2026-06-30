/**
 * Parse a boolean query parameter.
 * @param value
 */
export function parseBooleanQueryParam(value: boolean | string | null | undefined) {
  if (value === true) return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return false;
}
