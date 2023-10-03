// mute the console
import 'src/_test_utilities/consoleMock';

import {render, screen} from "src/_test_utilities/test-utils";
import CancelButton from "./CancelButton";

describe("Cancel Button tests", () => {
  beforeEach(() => {
    (console.error as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();
  });

  test("should render cancel button", () => {
    // GIVEN a CancelButton component
    // WHEN the component is rendered
    render(<CancelButton data-testid={"foo"}/>)

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND the component should be in the document
    const cancelButton = screen.getByTestId("foo");
    expect(cancelButton).toBeInTheDocument();
  });

  test("should render cancel button with provided name", () => {
    // GIVEN a CancelButton component with a custom name
    const customName = "Foo Bar";

    // WHEN the component is rendered
    render(<CancelButton>{customName}</CancelButton>);

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND the component should be findable by the custom name
    const cancelButton = screen.getByText(customName);
    // AND the component should be in the document
    expect(cancelButton).toBeInTheDocument();
  });

});