import { formatDate } from "./userFriendlyDateFormat";

describe("userFriendlyDateFormat", () => {
  test("should return a correctly formatted string", () => {
    // GIVEN a Date object
    const givenDate = new Date(2000, 0, 1, 6, 0, 0);

    // WHEN the function formattedDate is called with the given date
    const actualFormattedDate = formatDate(givenDate);

    // THEN expect the actualFormattedDate to be in the expected format
    expect(actualFormattedDate).toBe("Sat, Jan 1, 2000, 6:00 AM");
  });
});
