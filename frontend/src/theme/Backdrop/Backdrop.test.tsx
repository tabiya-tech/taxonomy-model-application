// mute the console
import "src/_test_utilities/consoleMock";

import { render, screen } from "src/_test_utilities/test-utils";
import { Backdrop, DATA_TEST_ID } from "./Backdrop";

describe("Backdrop render tests", () => {
  beforeEach(() => {
    (console.error as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();
  });

  it("should be shown", () => {
    // GIVEN a message
    const givenMessage = "foo-message";

    // WHEN the Backdrop is opened with the message
    render(<Backdrop isShown={true} message={givenMessage} />);

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();

    // AND the Backdrop should be visible
    const backdrop = screen.getByTestId(DATA_TEST_ID.BACKDROP_CONTAINER);
    expect(backdrop).toBeVisible();

    // AND the Backdrop should match the snapshot
    expect(backdrop).toMatchSnapshot();

    // AND the message should be visible
    const message = screen.getByTestId(DATA_TEST_ID.MESSAGE_ELEMENT);
    expect(message).toBeVisible();

    // AND the progress should be visible
    const progress = screen.getByTestId(DATA_TEST_ID.PROGRESS_ELEMENT);
    expect(progress).toBeVisible();
  });

  it("should be hidden", () => {
    // WHEN the Backdrop is hidden
    render(<Backdrop isShown={false} />);

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();

    // AND the Backdrop should not be visible
    const backdrop = screen.queryByTestId(DATA_TEST_ID.BACKDROP_CONTAINER);
    expect(backdrop).not.toBeVisible();
  });

  it("should rendered without message and not show any errors", () => {
    // WHEN the Backdrop is opened without message or data-testid
    render(<Backdrop isShown={true} />);

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();

    // AND the Backdrop should be visible
    const backdrop = screen.getByTestId(DATA_TEST_ID.BACKDROP_CONTAINER);
    expect(backdrop).toBeVisible();

    // AND the Backdrop should match the snapshot
    expect(backdrop).toMatchSnapshot();

    // AND the message should not  be visible
    const message = screen.queryByTestId(DATA_TEST_ID.MESSAGE_ELEMENT);
    expect(message).not.toBeInTheDocument();

    // AND the progress should be visible
    const progress = screen.getByTestId(DATA_TEST_ID.PROGRESS_ELEMENT);
    expect(progress).toBeVisible();
  });
});
