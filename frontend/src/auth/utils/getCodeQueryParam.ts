/**
 * Gets the code query param from the location
 * @returns string - The code query param
 * @param location
 */
export function getCodeQueryParam(location: Location | { search: string }) {
  const searchParams = new URLSearchParams(location.search);
  return searchParams.get("code") ?? "";
}
