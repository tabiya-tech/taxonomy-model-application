export function arrayFromString(str: string | null | undefined): string[] {
  return str === undefined || str === null || str.length === 0 ? [] : str.split("\n");
}

export function stringFromArray(list: string[]): string {
  return list.join("\n");
}
