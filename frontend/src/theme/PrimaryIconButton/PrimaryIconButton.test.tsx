// mute the console
import "src/_test_utilities/consoleMock";

import React from "react";
import { render, screen } from "src/_test_utilities/test-utils";
import PrimaryIconButton from "./PrimaryIconButton";
import { mockBrowserIsOnLine, unmockBrowserIsOnLine } from "src/_test_utilities/mockBrowserIsOnline";

describe("PrimaryIconButton tests", () => {
  beforeEach(() => {
    unmockBrowserIsOnLine();
    (console.error as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();
  });

  test("should render the icon button with default props", () => {
    // GIVEN a PrimaryIconButton component
    // WHEN the component is rendered
    const givenTestID = "test-icon";
    render(<PrimaryIconButton data-testid={givenTestID} />);

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND expect the icon to be in the document
    const primaryIconButton = screen.getByTestId(givenTestID);
    expect(primaryIconButton).toBeInTheDocument();
    // AND to match the snapshot
    expect(primaryIconButton).toMatchSnapshot();
  });

  test("should render the icon button with provided icon", () => {
    // GIVEN a PrimaryIconButton component with a custom icon
    const customIcon = <svg data-testid={"test-icon"} />;

    // WHEN the component is rendered
    render(<PrimaryIconButton>{customIcon}</PrimaryIconButton>);

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND expect the icon to be in the document
    const actualElement = screen.getByTestId("test-icon");
    expect(actualElement).toBeInTheDocument();
    // AND to match the snapshot
    expect(actualElement).toMatchSnapshot();
  });

  describe.each([
    [true, { disable: true, disableWhenOffline: true, isOnline: true }],
    [true, { disable: true, disableWhenOffline: true, isOnline: false }],
    [true, { disable: true, disableWhenOffline: false, isOnline: true }],
    [true, { disable: true, disableWhenOffline: false, isOnline: false }],
    [true, { disable: true, disableWhenOffline: undefined, isOnline: false }],
    [false, { disable: false, disableWhenOffline: true, isOnline: true }],
    [true, { disable: false, disableWhenOffline: true, isOnline: false }],
    [false, { disable: false, disableWhenOffline: false, isOnline: true }],
    [false, { disable: false, disableWhenOffline: false, isOnline: false }],
    [false, { disable: false, disableWhenOffline: undefined, isOnline: false }],
    [false, { disable: undefined, disableWhenOffline: true, isOnline: true }],
    [true, { disable: undefined, disableWhenOffline: true, isOnline: false }],
    [false, { disable: undefined, disableWhenOffline: undefined, isOnline: true }],
    [false, { disable: undefined, disableWhenOffline: undefined, isOnline: false }],
  ])("Disabled/enabled state", (expectedState, testCase) => {
    test(`should render the icon button disabled = ${expectedState} when ${JSON.stringify(testCase)}`, () => {
      mockBrowserIsOnLine(testCase.isOnline);

      // WHEN the component is rendered
      render(
        <PrimaryIconButton
          disabled={testCase.disable}
          disableWhenOffline={testCase.disableWhenOffline}
          data-testid={"test-icon"}
        />
      );

      // THEN expect no errors or warning to have occurred
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      // AND the icon button to be enabled
      const primaryIconButton = screen.getByTestId("test-icon");
      expect(primaryIconButton).toHaveProperty("disabled", expectedState);
    });
  });

  test("should render enable->disabled->enabled when online status changes", async () => {
    // GIVEN that the internet status is online
    mockBrowserIsOnLine(true);

    // GIVEN the component is rendered
    render(<PrimaryIconButton disableWhenOffline={true} data-testid={"test-icon"} />);

    // THEN expect the icon button to be enabled
    const primaryIconButton = screen.getByTestId("test-icon");
    expect(primaryIconButton).toBeEnabled();

    // WHEN the internet status changes to offline
    mockBrowserIsOnLine(false);

    // THEN expect the icon button to be disabled
    expect(primaryIconButton).toBeDisabled();

    // WHEN the internet status changes back to online
    mockBrowserIsOnLine(true);

    // THEN expect the icon button to be enabled
    expect(primaryIconButton).toBeEnabled();
  });
});
