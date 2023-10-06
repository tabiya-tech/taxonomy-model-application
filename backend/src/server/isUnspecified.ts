export function isUnspecified(s: string | undefined | null): boolean {
  return (
    s === undefined ||
    s === null ||
    (typeof s === "string" && s.trim().length === 0)
  );
}

export function isSpecified(s: string | undefined | null): boolean {
  return !isUnspecified(s);
}
