// mute the console
import "src/_test_utilities/consoleMock";

import { render, screen } from "src/_test_utilities/test-utils";
import PrimaryButton from "./PrimaryButton";

describe("Cancel Button tests", () => {
  beforeEach(() => {
    (console.error as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();
  });

  test("should render cancel button", () => {
    // GIVEN a PrimaryButton component
    // WHEN the component is rendered
    render(<PrimaryButton data-testid={"foo"} />);

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND  the component should be in the document
    const primaryButton = screen.getByTestId("foo");
    expect(primaryButton).toBeInTheDocument();
  });

  test("should render cancel button with provided name", () => {
    // GIVEN a PrimaryButton component with a custom name
    const customName = "Foo Bar";

    // WHEN the component is rendered
    render(<PrimaryButton>{customName}</PrimaryButton>);

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND  the component should be findable by the custom name
    const primaryButton = screen.getByText(customName);
    // AND the component should be in the document
    expect(primaryButton).toBeInTheDocument();
  });
});
