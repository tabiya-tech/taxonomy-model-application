//mute chatty console
import "_test_utilities/consoleMock";

import { EMPTY_UUID_HISTORY_ERROR_MESSAGE, getOriginUUIDFromUUIDHistory } from "./getOriginUUIDFromUUIDHistory";

describe("getOriginUUIDFromUUIDHistory", () => {
  test.each([
    { UUIDHistory: ["uuid-1", "uuid-2", "uuid-3"], originUUID: "uuid-3" },
    { UUIDHistory: ["uuid-1"], originUUID: "uuid-1" },
  ])("should return the origin uuid from the uuid history", ({ UUIDHistory, originUUID }) => {
    // GIVEN a uuid history
    const givenUUIDHistory = UUIDHistory;

    // AND expected origin uuid
    const expectedOriginUUID = originUUID;

    // WHEN the origin UUID is retrieved from the uuid history
    const actualOriginUUID = getOriginUUIDFromUUIDHistory(givenUUIDHistory);

    // THEN the result should match the expected output
    expect(actualOriginUUID).toEqual(expectedOriginUUID);
  });

  test("should log an error and return empty string if UUIDHistory is empty", () => {
    // GIVEN an empty uuid history
    const givenUUIDHistory: string[] = [];

    // WHEN the origin UUID is retrieved from the uuid history
    const actualOriginUUID = getOriginUUIDFromUUIDHistory(givenUUIDHistory);

    // THEN the result should be an empty string
    expect(actualOriginUUID).toEqual("");

    // AND an error should be logged
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining(EMPTY_UUID_HISTORY_ERROR_MESSAGE));
  });
});
