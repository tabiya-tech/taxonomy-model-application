import {render, screen} from "src/_test_utilities/test-utils";
import CancelButton from "./CancelButton";

describe("Cancel Button tests", () => {
  test("should render cancel button", () => {
    // GIVEN a CancelButton component
    // WHEN the component is rendered
    render(<CancelButton data-testid={"foo"}/>)

    // THEN the component should be in the document
    const cancelButton = screen.getByTestId("foo");
    expect(cancelButton).toBeInTheDocument();
  });

  test("should render cancel button with provided name", () => {
    // GIVEN a CancelButton component with a custom name
    const customName = "Foo Bar";

    // WHEN the component is rendered
    render(<CancelButton>{customName}</CancelButton>);

    // THEN the component should be findable by the custom name
    // AND the component should be in the document
    const cancelButton = screen.getByText(customName);
    expect(cancelButton).toBeInTheDocument();
  });

});