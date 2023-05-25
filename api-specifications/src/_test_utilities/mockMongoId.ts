export function getMockId(index: number): string {
  return index.toString(16).padStart(24, "0");
}