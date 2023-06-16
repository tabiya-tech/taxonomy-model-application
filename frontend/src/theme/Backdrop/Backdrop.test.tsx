import {render, screen} from "src/_test_utilities/test-utils";
import {Backdrop, DATA_TEST_ID} from "./Backdrop";

describe("Backdrop render tests", () => {
  it("should be shown", () => {
    // GIVEN a message
    const givenMessage = "foo-message";

    // WHEN the Backdrop is opened with the message
    render(<Backdrop isShown={true} message={givenMessage}/>);

    // THEN the Backdrop should be visible
    const backdrop = screen.getByTestId(DATA_TEST_ID.BACKDROP_CONTAINER);
    expect(backdrop).toBeVisible();

    // AND the message should be visible
    const message = screen.getByTestId(DATA_TEST_ID.MESSAGE_ELEMENT);
    expect(message).toBeVisible();

    // AND the progress should be visible
    const progress = screen.getByTestId(DATA_TEST_ID.PROGRESS_ELEMENT);
    expect(progress).toBeVisible();
  });

  it("should be hidden", () => {
    // WHEN the Backdrop is hidden
    render(<Backdrop isShown={false}/>);

    // THEN the Backdrop should not be visible
    const backdrop = screen.queryByTestId(DATA_TEST_ID.BACKDROP_CONTAINER);
    expect(backdrop).not.toBeVisible();
  });

  it("should rendered without message and not show any errors", () => {
    // WHEN the Backdrop is opened without message or data-testid
    render(<Backdrop isShown={true}/>);

    // THEN the Backdrop should be visible
    const backdrop = screen.getByTestId(DATA_TEST_ID.BACKDROP_CONTAINER);
    expect(backdrop).toBeVisible();

    // AND the message should not  be visible
    const message = screen.queryByTestId(DATA_TEST_ID.MESSAGE_ELEMENT);
    expect(message).not.toBeInTheDocument();

    // AND the progress should be visible
    const progress = screen.getByTestId(DATA_TEST_ID.PROGRESS_ELEMENT);
    expect(progress).toBeVisible();
  });
})