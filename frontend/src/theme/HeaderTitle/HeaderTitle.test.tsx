// mute the console
import "src/_test_utilities/consoleMock";

import HeaderTitle from "./HeaderTitle";
import { render, screen } from "src/_test_utilities/test-utils";

describe("HeaderTitle", () => {
  beforeEach(() => {
    (console.error as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();
  });

  test("should render header component with provided title", () => {
    // GIVEN the title
    const givenTitle = "Header title";

    // WHEN HeaderTitle component is rendered
    render(<HeaderTitle data-testid="header-title">{givenTitle}</HeaderTitle>);

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND the header title is in the document with the data-testid
    const actualElement = screen.getByTestId("header-title");
    expect(actualElement).toBeInTheDocument();
    // AND the header title has the given title
    expect(actualElement).toHaveTextContent(givenTitle);
    // AND to match the snapshot
    expect(actualElement).toMatchSnapshot();
  });
});
