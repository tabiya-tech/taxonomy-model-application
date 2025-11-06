export const EMPTY_UUID_HISTORY_ERROR_MESSAGE = "UUIDHistory is empty, cannot get origin UUID.";

/**
 * Get the origin UUID from UUIDHistory
 *
 * GIVEN on the UUID History is structured as above
 * [
 *   0, -> Current UUID
 *   1,
 *   2 -> Origin UUID
 * ]
 * @param UUIDHistory
 */
export function getOriginUUIDFromUUIDHistory(UUIDHistory: string[]): string {
  if (UUIDHistory.length > 0) return UUIDHistory.at(-1)!;

  // Unexpected case (we should not reach at this if everything goes well
  console.error(EMPTY_UUID_HISTORY_ERROR_MESSAGE);

  return "";
}
