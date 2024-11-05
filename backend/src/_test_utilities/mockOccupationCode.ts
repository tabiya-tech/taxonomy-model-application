import { generateRandomDigitString } from "./getMockRandomData";

const currentSegments: number[] = [0];
const MAX_SEGMENT_ITEMS = 15;

export function getMockRandomOccupationCode(local: boolean): string {
  const code = generateRandomDigitString(4, 4);
  // increment the segment counter
  incrementSegment(currentSegments.length - 1);
  const separator = local ? "_" : ".";
  return code + separator + currentSegments.join(separator);
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
