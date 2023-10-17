import { render, screen } from "src/_test_utilities/test-utils";
import NotFound, { DATA_TEST_ID } from "./NotFound";

describe("NotFound", () => {
  test("NotFound page renders correctly", () => {
    // GIVEN a NotFound page
    jest.spyOn(console, "error");
    jest.spyOn(console, "warn");
    render(<NotFound />);

    // THEN expect no console error or warning
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND expect the container to be present in the document
    expect(screen.getByTestId(DATA_TEST_ID.NOT_FOUND_CONTAINER)).toBeInTheDocument();
    // AND to match the snapshot
    expect(screen.getByTestId(DATA_TEST_ID.NOT_FOUND_CONTAINER)).toMatchSnapshot();
    // AND expect the illustration and message to be present in the document
    expect(screen.getByTestId(DATA_TEST_ID.NOT_FOUND_ILLUSTRATION)).toBeInTheDocument();
    expect(screen.getByTestId(DATA_TEST_ID.NOT_FOUND_MESSAGE)).toBeInTheDocument();
  });
});
