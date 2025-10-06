/**
 * Build a concrete route path string from a route regex by replacing token patterns.
 *
 * Example:
 *   buildPathFromRegex(/^\/models\/[0-9a-f]{24}\/occupationGroups$/, [[/[0-9a-f]{24}/, modelId]])
 *   -> "/models/<modelId>/occupationGroups"
 */
export function buildPathFromRegex(routeRegex: RegExp, replacements: Array<[RegExp, string]>): string {
  let path = routeRegex.source
    .replace(/^\^/, "")
    .replace(/\$$/, "")
    .replace(/\\\//g, "/")
    .replace(/\((?:\?:)?([^)]*)\)/g, "$1"); // drop capturing & non-capturing groups for readability

  for (const [pattern, value] of replacements) {
    path = path.replace(pattern, value);
  }

  return path;
}

export default buildPathFromRegex;
