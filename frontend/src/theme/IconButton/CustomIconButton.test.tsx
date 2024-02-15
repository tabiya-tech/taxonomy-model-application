// mute the console
import "src/_test_utilities/consoleMock";

import React from "react";
import { render, screen } from "src/_test_utilities/test-utils";
import CustomIconButton from "./CustomIconButton";

describe("CustomIconButton tests", () => {
  beforeEach(() => {
    (console.error as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();
  });

  test("should render with the provided icon", () => {
    // GIVEN an icon
    const icon = <svg data-testid={"test-icon"} />;

    // WHEN the component is rendered
    render(<CustomIconButton>{icon}</CustomIconButton>);

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND expect the icon to be in the document
    const actualElement = screen.getByTestId("test-icon");
    expect(actualElement).toBeInTheDocument();
    // AND to match the snapshot
    expect(actualElement).toMatchSnapshot();
  });
});
