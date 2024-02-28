// mute the console
import "src/_test_utilities/consoleMock";

import FormattedDatePropertyField from "./FormattedDatePropertyField";
import { render, screen } from "@testing-library/react";
import TextPropertyField from "src/theme/PropertyFieldLayout/TextPropertyField/TextPropertyField";

// Mock the TextPropertyField component
jest.mock("src/theme/PropertyFieldLayout/TextPropertyField/TextPropertyField", () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation((props) => {
      return <div data-testid={props["data-testid"]}> </div>;
    }),
  };
});

describe("FormattedDatePropertyField", () => {
  test("renders correctly", () => {
    // GIVEN a Date object
    const givenDate = new Date(2000, 0, 1, 6, 0, 0);
    // AND a label
    const givenLabel = "foo-label";
    // AND a data-testid
    const givenDataTestId = "foo-data-test-id";
    // AND a fieldId
    const givenFieldId = "foo-field-id";
    // AND the userFriendlyDateFormat function will return a given string formatted date
    // to avoid breaking the snapshot test as the date will change depending on the local timezone
    const givenUserFriendlyFormattedDate = "foo-date-user-friendly-formatted";
    const formatDateSpy = jest
      .spyOn(require("src/theme/PropertyFieldLayout/FormattedDatePropertyField/userFriendlyDateFormat"), "formatDate")
      .mockReturnValue(givenUserFriendlyFormattedDate);

    // WHEN the component is rendered
    render(
      <FormattedDatePropertyField
        date={givenDate}
        label={givenLabel}
        data-testid={givenDataTestId}
        fieldId={givenFieldId}
      />
    );

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND the component to be displayed
    const formattedDatePropertyComponent = screen.getByTestId(givenDataTestId);
    expect(formattedDatePropertyComponent).toBeInTheDocument();

    // AND the formatDateSpy function to have been called with the given date
    expect(formatDateSpy).toHaveBeenCalledWith(givenDate);
    // AND the TextPropertyField to have been called with the
    // givenLabel, givenUserFriendlyFormattedDate, givenFieldId, and givenDataTestId
    const expectedTextPropertyFieldProps = {
      label: givenLabel,
      text: givenUserFriendlyFormattedDate,
      fieldId: givenFieldId,
      "data-testid": givenDataTestId,
    };
    expect(TextPropertyField).toHaveBeenCalledWith(expectedTextPropertyFieldProps, {});
    // AND to match the snapshot
    expect(formattedDatePropertyComponent).toMatchSnapshot();
  });
});
