import { match } from "path-to-regexp";

type BaseReturn = object;

/**
 * Parse a path string based on a path template.
 *
 * @param pathTemplate the path template to use for parsing
 * @param path the path string to parse
 */
export function parsePath<T extends BaseReturn>(pathTemplate: string, path: string): T {
  const parsePathFn = match(pathTemplate);

  const res = parsePathFn(path);
  if (!res) {
    return {} as T;
  }

  return res.params as T;
}
