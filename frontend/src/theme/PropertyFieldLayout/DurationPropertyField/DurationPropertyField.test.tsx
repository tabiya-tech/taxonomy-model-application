// mute the console
import "src/_test_utilities/consoleMock";

import DurationPropertyField from "./DurationPropertyField";
import { render } from "@testing-library/react";
import TextPropertyField from "src/theme/PropertyFieldLayout/TextPropertyField/TextPropertyField";

// Mock the TextPropertyField component
jest.mock("src/theme/PropertyFieldLayout/TextPropertyField/TextPropertyField", () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation((props) => {
      return <div data-testid={props["data-testid"]}>Mock TextPropertyField</div>;
    }),
  };
});

describe("DurationPropertyField", () => {
  test("renders correctly", () => {
    // GIVEN a label
    const givenLabel = "Duration";
    // AND two dates
    const givenFirstDate = new Date("2021-10-10");
    const givenSecondDate = new Date("2021-10-20");
    // AND a fieldId
    const givenFieldId = "field-id";
    // AND a data-testid
    const givenDataTestId = "duration-property-field";
    // AND getDurationBetweenDates will return the expected duration
    const expectedDuration = "10 days";
    const getDurationBetweenDates = jest
      .spyOn(require("./getDurationBetweenDates"), "getDurationBetweenDates")
      .mockReturnValue(expectedDuration);

    // WHEN the DurationPropertyField is rendered with the given label and dates
    render(
      <DurationPropertyField
        label={givenLabel}
        firstDate={givenFirstDate}
        secondDate={givenSecondDate}
        fieldId={givenFieldId}
        data-testid={givenDataTestId}
      />
    );

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND getDurationBetweenDates to have been called with the given dates
    expect(getDurationBetweenDates).toHaveBeenCalledWith(givenFirstDate, givenSecondDate);
    // AND the TextPropertyField to have been rendered with the givenLabel and the expected duration
    expect(TextPropertyField).toHaveBeenCalledWith(
      { label: givenLabel, text: expectedDuration, fieldId: givenFieldId, "data-testid": givenDataTestId },
      {}
    );
  });

  test("renders with ongoing text when the second date is not provided", () => {
    // GIVEN a label
    const givenLabel = "Duration";
    // AND a date which is before the current date
    const givenFirstDate = new Date(new Date().getTime() - 10 * 60 * 1000);
    // AND a fieldId
    const givenFieldId = "field-id";
    // AND a data-testid
    const givenDataTestId = "duration-property-field";
    // AND getDurationBetweenDates will return the expected duration
    const expectedDuration = "10 minutes";
    const getDurationBetweenDates = jest
      .spyOn(require("./getDurationBetweenDates"), "getDurationBetweenDates")
      .mockReturnValue(expectedDuration);

    // WHEN the DurationPropertyField is rendered with the given label and dates
    render(
      <DurationPropertyField
        label={givenLabel}
        firstDate={givenFirstDate}
        fieldId={givenFieldId}
        data-testid={givenDataTestId}
      />
    );

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND getDurationBetweenDates to have been called with the given dates
    expect(getDurationBetweenDates).toHaveBeenCalledWith(givenFirstDate, expect.any(Date)); // Can't use the current date because milliseconds will differ based on the execution time
    // AND the TextPropertyField to have been rendered with the givenLabel and the expected duration
    expect(TextPropertyField).toHaveBeenCalledWith(
      {
        label: givenLabel,
        text: `${expectedDuration} (ongoing)`,
        fieldId: givenFieldId,
        "data-testid": givenDataTestId,
      },
      {}
    );
  });

  test("renders with a message when the date range is invalid", () => {
    // GIVEN a label
    const givenLabel = "Duration";
    // AND two dates where the second date is before the first date
    const givenFirstDate = new Date("2021-10-20");
    const givenSecondDate = new Date(givenFirstDate.getDate() - 1);
    // AND a fieldId
    const givenFieldId = "field-id";
    // AND a data-testid
    const givenDataTestId = "duration-property-field";

    // AND getDurationBetweenDates will throw an error
    const givenError = new Error("Invalid date range");
    jest
      .spyOn(require("./getDurationBetweenDates"), "getDurationBetweenDates")
      .mockImplementation(() => {
        throw givenError;
      });

    // WHEN the DurationPropertyField is rendered with the given label and dates
    render(
      <DurationPropertyField
        label={givenLabel}
        firstDate={givenFirstDate}
        secondDate={givenSecondDate}
        fieldId={givenFieldId}
        data-testid={givenDataTestId}
      />
    );

    // THEN expect an error to have been logged to the console
    expect(console.error).toHaveBeenCalledWith(givenError);
    // AND the TextPropertyField to have been rendered with the givenLabel and the expected error message
    expect(TextPropertyField).toHaveBeenCalledWith(
      {
        label: givenLabel,
        text: "Invalid date range",
        fieldId: givenFieldId,
        "data-testid": givenDataTestId,
      },
      {}
    );
  })
});
