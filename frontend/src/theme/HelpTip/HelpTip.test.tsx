//mute chatty console
import "src/_test_utilities/consoleMock";

import React from "react";
import { render, screen, fireEvent, waitFor } from "src/_test_utilities/test-utils";
import "@testing-library/jest-dom";
import HelpTip, { DATA_TEST_ID } from "./HelpTip";
import Tooltip from "@mui/material/Tooltip";

describe("HelpTip component render tests", () => {
  test("renders correctly with children content", () => {
    // GIVEN the HelpTip component is rendered with specific children content
    const givenChild = <div>"This is a helpful tip"</div>;
    // WHEN the component mounts
    // @ts-ignore
    const renderSpy: jest.Mock = jest.spyOn(Tooltip, "render");
    render(<HelpTip>{givenChild}</HelpTip>);
    // THEN it should display the help IconButton
    const helpIconButton = screen.getByTestId(DATA_TEST_ID.HELP_ICON);
    expect(helpIconButton).toBeInTheDocument();
    // AND the MUI Tooltip should have been called with the correct props
    expect(renderSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.objectContaining({
          props: expect.objectContaining({
            children: givenChild,
          }),
        }),
        "aria-label": "help",
        describeChild: true,
      }),
      null
    );
    // AND no errors or warnings should have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND it should match the snapshot
    expect(HelpTip).toMatchSnapshot();
  });
});

describe("HelpTip component interaction tests", () => {
  test("displays tooltip on hover or focus", async () => {
    // GIVEN the HelpTip component is rendered with specific children content
    const childrenContent = "This is a helpful tip";
    render(<HelpTip>{childrenContent}</HelpTip>);
    const helpIconButton = screen.getByRole("button");
    // WHEN the user hovers over or focuses on the HelpTip icon
    fireEvent.mouseOver(helpIconButton);
    // THEN the tooltip should become visible
    // AND should display the provided children content as the tooltip message
    await waitFor(() => {
      expect(screen.getByText(childrenContent)).toBeVisible();
    });
    // AND no errors or warnings should have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });

  test("hides tooltip when not focused or hovered", async () => {
    // GIVEN the HelpTip component is rendered with specific children content
    const childrenContent = "This is a helpful tip";
    render(<HelpTip>{childrenContent}</HelpTip>);
    const helpIconButton = screen.getByRole("button");
    // AND the tooltip is currently displayed because the user hovered over or focused on the HelpTip icon
    fireEvent.mouseOver(helpIconButton);
    // Guard assertion
    await waitFor(() => {
      expect(screen.getByText(childrenContent)).toBeVisible();
    });
    // WHEN the user moves the cursor away or the icon loses focus
    fireEvent.mouseOut(helpIconButton);
    // THEN the tooltip should become hidden
    await waitFor(() => {
      expect(screen.queryByText(childrenContent)).not.toBeInTheDocument();
    });
    // AND no errors or warnings should have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });
});
