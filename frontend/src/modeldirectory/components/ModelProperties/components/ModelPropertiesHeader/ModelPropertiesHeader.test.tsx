// mute the console
import "src/_test_utilities/consoleMock";

import { render, screen, within } from "src/_test_utilities/test-utils";
import ModelPropertiesHeader, { DATA_TEST_ID } from "./ModelPropertiesHeader";
import userEvent from "@testing-library/user-event";
import { fakeModel, getOneFakeModel } from "src/modeldirectory/components/ModelsTable/_test_utilities/mockModelData";

import { ALL_USERS, authorizationTests } from "src/_test_utilities/authorizationTests";

describe("ModelPropertiesHeader", () => {
  beforeEach(() => {
    (console.error as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();
  });

  describe(
    // eslint-disable-next-line jest/valid-describe-callback,jest/valid-title
    authorizationTests.defaultName,
    authorizationTests.callback({
      name: "ModelPropertiesHeader",
      Component: <ModelPropertiesHeader model={getOneFakeModel(1)} notifyOnClose={jest.fn()} />,
      roles: ALL_USERS,
      testIds: [
        DATA_TEST_ID.MODEL_PROPERTIES_HEADER,
        DATA_TEST_ID.MODEL_PROPERTIES_HEADER_TITLE,
        DATA_TEST_ID.MODEL_PROPERTIES_HEADER_CLOSE_BUTTON,
        DATA_TEST_ID.MODEL_PROPERTIES_MODEL_NAME,
      ],
    })
  );

  test("should render model properties header component", () => {
    // GIVEN a model
    const givenModel = fakeModel;
    // AND a notifyOnClose callback function
    const givenNotifyOnCloseCallback = jest.fn();

    // WHEN ModelPropertiesHeader component is rendered
    render(<ModelPropertiesHeader model={givenModel} notifyOnClose={givenNotifyOnCloseCallback} />);

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND the header to be displayed
    const headerElement = screen.getByTestId(DATA_TEST_ID.MODEL_PROPERTIES_HEADER);
    expect(headerElement).toBeInTheDocument();
    // AND the title to be displayed in the header
    const titleElement = within(headerElement).getByTestId(DATA_TEST_ID.MODEL_PROPERTIES_HEADER_TITLE);
    expect(titleElement).toBeInTheDocument();
    // AND the close icon button to be displayed in the header
    const closeButtonElement = within(headerElement).getByTestId(DATA_TEST_ID.MODEL_PROPERTIES_HEADER_CLOSE_BUTTON);
    expect(closeButtonElement).toBeInTheDocument();
    // AND the model name to be displayed in the header and be properly formatted: "model name (locale short code)"
    const modelNameElement = within(headerElement).getByTestId(DATA_TEST_ID.MODEL_PROPERTIES_MODEL_NAME);
    expect(modelNameElement).toBeInTheDocument();
    expect(modelNameElement).toHaveTextContent(`${givenModel.name} (${givenModel.locale.shortCode})`);
    // AND to match the snapshot
    expect(screen.getByTestId(DATA_TEST_ID.MODEL_PROPERTIES_HEADER)).toMatchSnapshot();
  });

  test("should call notifyOnClose when the close icon button is clicked", async () => {
    // GIVEN notifyOnClose callback function
    const givenNotifyOnCloseCallback = jest.fn();
    // AND the ModelPropertiesHeader component is rendered
    render(<ModelPropertiesHeader model={getOneFakeModel(1)} notifyOnClose={givenNotifyOnCloseCallback} />);

    // WHEN the close icon button is clicked
    await userEvent.click(screen.getByTestId(DATA_TEST_ID.MODEL_PROPERTIES_HEADER_CLOSE_BUTTON));

    // THEN expect the notifyOnClose callback to be triggered
    expect(givenNotifyOnCloseCallback).toHaveBeenCalled();
  });

  test("should catch the error and log it when the parent's notifyOnClose throws an error", async () => {
    // GIVEN a notifyOnClose callback function that will throw an error
    const givenError = new Error("Error in notifyOnClose");
    const givenNotifyOnCloseCallback = jest.fn(() => {
      throw givenError;
    });
    // AND the ModelPropertiesHeader component is rendered with the given notifyOnClose callback
    render(<ModelPropertiesHeader model={getOneFakeModel(1)} notifyOnClose={givenNotifyOnCloseCallback} />);

    // WHEN the close icon button is clicked
    await userEvent.click(screen.getByTestId(DATA_TEST_ID.MODEL_PROPERTIES_HEADER_CLOSE_BUTTON));

    // THEN expect the given error to be logged
    expect(console.error).toHaveBeenCalledWith(givenError);
  });

  test("should catch the error and log it when the parent's notifyOnClose was not given", async () => {
    // GIVEN the ModelPropertiesHeader component is rendered without a notifyOnClose callback
    // @ts-ignore
    render(<ModelPropertiesHeader model={getOneFakeModel(1)} notifyOnClose={null} />);

    // WHEN the close icon button is clicked
    await userEvent.click(screen.getByTestId(DATA_TEST_ID.MODEL_PROPERTIES_HEADER_CLOSE_BUTTON));

    // THEN expect an error to be logged
    expect(console.error).toHaveBeenCalled();
  });
});
