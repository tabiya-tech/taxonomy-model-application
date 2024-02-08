import React from "react";
import { render, screen } from "src/_test_utilities/test-utils";
import CustomIconButton, { DATA_TEST_ID } from "./CustomIconButton";
import { fireEvent } from "@testing-library/react";

describe("CustomIconButton tests", () => {
  test("should render with the provided icon", () => {
    // GIVEN an icon
    const icon = <svg data-testid={"test-icon"} />;

    // WHEN the component is rendered
    render(<CustomIconButton handleClick={jest.fn()} icon={icon} disabled={false} ariaLabel="test label" />);

    // THEN expect the icon to be in the document
    const iconElement = screen.getByTestId("test-icon");
    expect(iconElement).toBeInTheDocument();
  });

  test("should render the icon button with a disabled state", () => {
    // GIVEN the component is rendered
    // WHEN the component is rendered with the disabled prop set to true
    render(<CustomIconButton handleClick={jest.fn()} icon={<svg />} disabled={true} ariaLabel="test label" />);

    // THEN expect the button to be disabled
    const iconButton = screen.getByTestId(DATA_TEST_ID.ICON_BUTTON);
    expect(iconButton).toBeDisabled();
  })

  test("should call onClick when the icon button is clicked", () => {
    // GIVEN the component is rendered
    // Create a mock function
    const handleClick = jest.fn();
    render(<CustomIconButton handleClick={handleClick} icon={<svg />} disabled={false} ariaLabel="test label" />);

    // WHEN the button is clicked
    const iconButton = screen.getByTestId(DATA_TEST_ID.ICON_BUTTON);
    fireEvent.click(iconButton);

    // THEN expect onClick callback to have been called
    expect(handleClick).toHaveBeenCalled();
  });
  test("should not call onClick when the icon button is clicked and disabled", () => {
    // GIVEN the component is rendered with the disabled prop set to true
    // Create a mock function
    const handleClick = jest.fn();
    render(<CustomIconButton handleClick={handleClick} icon={<svg />} disabled={true} ariaLabel="test label" />);

    // WHEN the button is clicked
    const iconButton = screen.getByTestId(DATA_TEST_ID.ICON_BUTTON);
    fireEvent.click(iconButton);

    // THEN expect onClick callback not to have been called
    expect(handleClick).not.toHaveBeenCalled();
  });
});
