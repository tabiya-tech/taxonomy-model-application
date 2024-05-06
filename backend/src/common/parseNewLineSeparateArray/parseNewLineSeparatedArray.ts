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
  const strArray = str.split("\n");
  const uniqueArray = Array.from(new Set(strArray));
  return { uniqueArray: uniqueArray, duplicateCount: strArray.length - uniqueArray.length };
}
