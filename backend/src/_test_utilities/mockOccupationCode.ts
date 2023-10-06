import { generateRandomDigitString } from "./specialCharacters";

const currentSegments: number[] = [0];
const MAX_SEGMENT_ITEMS = 15;

export function getMockRandomOccupationCode(): string {
  const code = generateRandomDigitString(2, 4);
  // increment the segment counter
  incrementSegment(currentSegments.length - 1);
  return code + "." + currentSegments.join(".");
}

function incrementSegment(index: number) {
  if (index < 0) {
    currentSegments.push(1);
    return;
  }
  currentSegments[index] = currentSegments[index] + 1;
  if (currentSegments[index] > MAX_SEGMENT_ITEMS) {
    currentSegments[index] = 1;
    incrementSegment(index - 1);
  }
}
