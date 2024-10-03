import { randomUUID, RandomUUIDOptions } from "crypto";

/**
 * Generates a random UUIDs.
 * @param count - The number of UUIDs to generate.
 * @param options - The options to use when generating the UUID.
 */
export function generateRandomUUIDs(count: number = 1, options?: RandomUUIDOptions): string[] {
  const uuids = [];
  for (let i = 0; i < count; i++) {
    uuids.push(randomUUID(options));
  }
  return uuids;
}
