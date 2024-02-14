// mute the console
import "src/_test_utilities/consoleMock";

import { render, screen } from "src/_test_utilities/test-utils";
import ModelPropertiesHeader, { DATA_TEST_ID } from "./ModelPropertiesHeader";
import userEvent from "@testing-library/user-event";

describe("ModelPropertiesHeader", () => {
  beforeEach(() => {
    (console.error as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();
  });

  test("should render model properties header component", () => {
    // GIVEN the title and notifyOnClose callback function
    const givenTitle = "Header title";
    const givenNotifyOnCloseCallback = jest.fn();

    // WHEN ModelPropertiesHeader component is rendered
    render(<ModelPropertiesHeader title={givenTitle} notifyOnClose={givenNotifyOnCloseCallback} />);

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND specific elements to be present in the document
    expect(screen.getByTestId(DATA_TEST_ID.MODEL_PROPERTIES_HEADER)).toBeInTheDocument();
    expect(screen.getByTestId(DATA_TEST_ID.MODEL_PROPERTIES_HEADER_TITLE)).toBeInTheDocument();
    expect(screen.getByTestId(DATA_TEST_ID.MODEL_PROPERTIES_HEADER_CLOSE_BUTTON)).toBeInTheDocument();
    // AND to match the snapshot
    expect(screen.getByTestId(DATA_TEST_ID.MODEL_PROPERTIES_HEADER)).toMatchSnapshot();
  });

  test("should call notifyOnClose when the close icon button is clicked", async () => {
    // GIVEN notifyOnClose callback function
    const givenNotifyOnCloseCallback = jest.fn();
    // AND the ModelPropertiesHeader component is rendered
    render(<ModelPropertiesHeader title="header title" notifyOnClose={givenNotifyOnCloseCallback} />);

    // WHEN the close icon button is clicked
    await userEvent.click(screen.getByTestId(DATA_TEST_ID.MODEL_PROPERTIES_HEADER_CLOSE_BUTTON));

    // THEN expect the notifyOnClose callback to be triggered
    expect(givenNotifyOnCloseCallback).toHaveBeenCalled();
  });
});
