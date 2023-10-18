// mute the console
import "src/_test_utilities/consoleMock";

import React from "react";
import { act, render, screen } from "src/_test_utilities/test-utils";
import { DATA_TEST_ID, useSnackbar } from "./SnackbarProvider";
import userEvent from "@testing-library/user-event";
import { Button } from "@mui/material";

describe("SnackbarProvider render tests", () => {
  beforeEach(() => {
    (console.error as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();
  });

  it("renders children correctly", () => {
    render(<div data-testid="test-child">Test Child</div>);

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();

    const childElement = screen.getByTestId("test-child");
    expect(childElement).toBeInTheDocument();
  });
});

describe("SnackbarProvider render action tests", () => {
  const TestButton = () => {
    const { enqueueSnackbar } = useSnackbar();
    const handleSnackbar = () => {
      enqueueSnackbar("message", { variant: "success" });
    };
    return (
      <Button data-testid="test-button" onClick={handleSnackbar} style={{ textTransform: "uppercase" }}>
        Test
      </Button>
    );
  };

  it("should close the snackbar when the close button is clicked", async () => {
    // GIVEN a component that is using the snackbar
    render(<TestButton />);

    // WHEN the snackbar is shown
    // useFakeTimers to speed up the test as the snackbar is animated, and we don't want to wait for the animation
    jest.useFakeTimers();
    const userEventFakeTimer = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const testButton = screen.getByTestId("test-button");
    await userEventFakeTimer.click(testButton);

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND the snackbar to be visible
    act(() => jest.runOnlyPendingTimers());
    const closeButton = screen.getByTestId(DATA_TEST_ID.SNACKBAR_CLOSE_BUTTON);
    expect(closeButton).toBeVisible();
    // AND the button to match the snapshot
    expect(closeButton).toMatchSnapshot();
    // AND the snackbar close button is clicked
    await userEventFakeTimer.click(closeButton);
    // AND the snackbar should be closed
    act(() => jest.runOnlyPendingTimers());
    expect(closeButton).not.toBeVisible();

    jest.useRealTimers();
  });
});
