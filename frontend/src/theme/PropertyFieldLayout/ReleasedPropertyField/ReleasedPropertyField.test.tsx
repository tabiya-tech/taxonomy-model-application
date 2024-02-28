// mute the console
import "src/_test_utilities/consoleMock";

import React from "react";
import ReleasedPropertyField, { DATA_TEST_ID, TEXT } from "./ReleasedPropertyField";
import { render, screen, within } from "src/_test_utilities/test-utils";

describe("ReleasedPropertyField", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (console.error as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();
  });

  test.each([
    [
      "Released",
      true,
      {
        expectedIcon: DATA_TEST_ID.RELEASED_ICON,
        expectedText: TEXT.RELEASED,
        expectedTextTestId: DATA_TEST_ID.RELEASED_TEXT,
      },
    ],
    [
      "Not Released",
      false,
      {
        expectedIcon: DATA_TEST_ID.NOT_RELEASED_ICON,
        expectedText: TEXT.NOT_RELEASED,
        expectedTextTestId: DATA_TEST_ID.NOT_RELEASED_TEXT,
      },
    ],
  ])("should render with provided '%s' status", (_description, givenReleaseStatus, expectedElements) => {
    // GIVEN a released status
    // AND a valid fieldId
    const givenFieldId = "field-id";
    // AND a data-testid
    const givenDataTestId = "released-details";

    // WHEN the component is rendered
    render(
      <ReleasedPropertyField released={givenReleaseStatus} data-testid={givenDataTestId} fieldId={givenFieldId} />
    );

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND the component to be displayed
    const expectedReleasedPropertyComponent = screen.getByTestId(givenDataTestId);
    expect(expectedReleasedPropertyComponent).toBeInTheDocument();
    // AND the tile to be shown
    const expectedTitle = screen.getByText("Released Status");
    expect(expectedTitle).toBeInTheDocument();
    // AND the released property field status to be shown
    const expectedReleasedPropertyFieldStatus = screen.getByTestId(DATA_TEST_ID.RELEASED_PROPERTY_FIELD_STATUS);
    expect(expectedReleasedPropertyFieldStatus).toBeInTheDocument();
    // AND the Typography component to be shown
    const expectedTypographyComponent = screen.getByTestId(expectedElements.expectedTextTestId);
    expect(expectedTypographyComponent).toBeInTheDocument();
    // AND the released status text to be shown wrapped in the Typography component
    const expectedReleasedStatusText = within(expectedTypographyComponent).getByText(expectedElements.expectedText);
    expect(expectedReleasedStatusText).toBeInTheDocument();
    // AND the icon to be shown
    const expectedIcon = screen.getByTestId(expectedElements.expectedIcon);
    expect(expectedIcon).toBeInTheDocument();
    // AND the component to match the snapshot
    expect(expectedReleasedPropertyComponent).toMatchSnapshot();
  });
});
