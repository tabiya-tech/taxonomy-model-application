import {render, screen} from "src/_test_utilities/test-utils";
import CancelButton from "./CancelButton";

describe("Cancel Button tests", () => {
  test("should render cancel button", () => {

    render(<CancelButton data-testid={"foo"}/>)
    const cancelButton = screen.getByTestId("foo");
    expect(cancelButton).toBeInTheDocument();
  });

  test.todo("should render cancel button with provided name");

});