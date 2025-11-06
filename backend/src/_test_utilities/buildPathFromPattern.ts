import { compile } from "path-to-regexp";

/**
 * Build a concrete route path string from a route pattern by replacing parameters.
 *
 * Example:
 *   buildPathFromPattern("/models/:modelId/occupationGroups/:id?", { modelId: "123", id: "456" })
 *   -> "/models/123/occupationGroups/456"
 */
export function buildPathFromPattern(routePattern: string, params: Record<string, string>): string {
  const toPath = compile(routePattern);
  return toPath(params);
}
