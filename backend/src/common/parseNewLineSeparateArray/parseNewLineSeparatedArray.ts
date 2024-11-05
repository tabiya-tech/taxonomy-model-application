export function arrayFromString(str: string | null | undefined): string[] {
  return str === undefined || str === null || str.length === 0 ? [] : str.split("\n");
}

export function stringFromArray(list: string[]): string {
  return list.join("\n");
}

export function uniqueArrayFromString(str: string | null | undefined): {
  uniqueArray: string[];
  duplicateCount: number;
} {
  if (str === undefined || str === null || str.length === 0) {
    return { uniqueArray: [], duplicateCount: 0 };
  }
  // we trim here since we want to consider "foo" and "foo " as the same string
  const strArray = str.split("\n").map((s) => s.trim());
  const uniqueArray = Array.from(new Set(strArray));
  return { uniqueArray: uniqueArray, duplicateCount: strArray.length - uniqueArray.length };
}
