//mute chatty console
import "src/_test_utilities/consoleMock";

import React from "react";
import { render, screen, fireEvent, waitFor } from "src/_test_utilities/test-utils";
import "@testing-library/jest-dom";
import HelpTip, { DATA_TEST_ID } from "./HelpTip";
import userEvent from "@testing-library/user-event";
import { Tooltip } from "@mui/material";

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
        disableTouchListener: true,
        open: false,
        onMouseEnter: expect.any(Function),
        onMouseLeave: expect.any(Function),
        onClick: expect.any(Function),
        onBlur: expect.any(Function),
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
  test("should display the tooltip when the user hovers over the icon", async () => {
    // GIVEN the HelpTip component is rendered with specific children content
    const childrenContent = "This is a helpful tip";
    render(<HelpTip>{childrenContent}</HelpTip>);
    const helpIconButton = screen.getByRole("button");

    // WHEN the user moves the cursor over the HelpTip icon
    fireEvent.mouseEnter(helpIconButton);

    // THEN the tooltip should become visible
    // AND should display the provided children content as the tooltip message
    await waitFor(() => {
      expect(screen.getByText(childrenContent)).toBeVisible();
    });
    // AND no errors or warnings should have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });

  test("should hide the tooltip when the user does not hover over the icon", async () => {
    // GIVEN the HelpTip component is rendered with specific children content
    const childrenContent = "This is a helpful tip";
    render(<HelpTip>{childrenContent}</HelpTip>);
    const helpIconButton = screen.getByRole("button");
    // AND the tooltip is currently displayed because the user moved the cursor over the HelpTip icon
    fireEvent.mouseEnter(helpIconButton);
    // Guard assertion
    await waitFor(() => {
      expect(screen.getByText(childrenContent)).toBeVisible();
    });

    // WHEN the user moves the cursor away or the icon loses focus
    fireEvent.mouseLeave(helpIconButton);

    // THEN the tooltip should become hidden
    await waitFor(() => {
      expect(screen.queryByText(childrenContent)).not.toBeInTheDocument();
    });
    // AND no errors or warnings should have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });

  test("should display the tooltip when the icon is clicked", async () => {
    // GIVEN the HelpTip component is rendered with specific children content
    const childrenContent = "This is a helpful tip";
    render(<HelpTip>{childrenContent}</HelpTip>);
    const helpIconButton = screen.getByRole("button");

    // WHEN the user clicks on the HelpTip icon
    await userEvent.click(helpIconButton);

    // THEN the tooltip should become visible
    // AND should display the provided children content as the tooltip message
    await waitFor(() => {
      expect(screen.getByText(childrenContent)).toBeVisible();
    });
    // AND no errors or warnings should have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });

  test("should hide the tooltip when the user clicks outside of it", async () => {
    // GIVEN the HelpTip component is rendered with specific children content
    const childrenContent = "This is a helpful tip";
    render(<HelpTip data-testid="tooltip-component">{childrenContent}</HelpTip>);
    const helpIconButton = screen.getByRole("button");
    // AND the tooltip is currently displayed because the user clicked on the HelpTip icon
    await userEvent.click(helpIconButton);
    // Guard assertion to ensure the tooltip is visible
    await waitFor(() => {
      expect(screen.getByText(childrenContent)).toBeVisible();
    });

    // WHEN the user clicks away from the tooltip
    await userEvent.click(document.body);

    // THEN the tooltip should become hidden
    await waitFor(() => {
      expect(screen.queryByText(childrenContent)).not.toBeInTheDocument();
    });
    // AND no errors or warnings should have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });
});
