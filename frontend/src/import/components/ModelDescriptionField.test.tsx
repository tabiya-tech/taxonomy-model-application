// mute the console
import "src/_test_utilities/consoleMock";

import { render, screen } from "src/_test_utilities/test-utils";
import { ModelDescriptionField, DATA_TEST_ID, TEXT } from "./ModelDescriptionField";
import { getTestString } from "src/_test_utilities/specialCharacters";
import { isSpecified } from "src/utils/isUnspecified";
import React from "react";
import { typeDebouncedInput } from "src/_test_utilities/userEventFakeTimer";

describe("ModelDescriptionField render tests", () => {
  beforeEach(() => {
    (console.error as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();
  });

  test.each([
    ["without default model description", undefined],
    ["with default model description", "Default description"],
  ])("should render %s", (_, givenModelDescription: string|undefined ) => {
    // WHEN the model name field is rendered
    render(<ModelDescriptionField modelDescription={givenModelDescription}/>);

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND the descriptionField to be visible
    const descField = screen.getByTestId(DATA_TEST_ID.MODEL_DESCRIPTION_FIELD);
    expect(descField).toBeInTheDocument();
    // AND to match the snapshot
    expect(descField).toMatchSnapshot();

    // AND expect the import to be visible
    const input = screen.getByTestId(DATA_TEST_ID.MODEL_DESC_INPUT);
    // AND expect the input to have a correct id
    expect(isSpecified(input.id)).toBe(true);
    // AND expect the input to have the empty string as value
    expect(input).toHaveValue(givenModelDescription?? "");
    // AND expect the placeholder to be correct
    expect(input).toHaveAttribute("placeholder", TEXT.MODEL_DESC_PLACEHOLDER);
    // AND expect label to be visible
    const label: HTMLLabelElement = screen.getByTestId(DATA_TEST_ID.MODEL_DESC_LABEL);
    expect(label).toBeInTheDocument();
    expect(label).toBeVisible();
    // AND expect label to have correct text
    expect(label).toHaveTextContent(TEXT.MODEL_DESC_LABEL);
    // AND expect label to be linked to inputField
    expect(label).toHaveAttribute("for", input.id);
  });
});

describe("ModelDescriptionField action tests", () => {
  test("should correctly notify the notifyModelDescriptionChanged handler when the user types", async () => {
    // GIVEN a notifyModelDescriptionChanged mock
    const notifyModelDescriptionChangedHandlerMock = jest.fn();

    // AND that the model description field is rendered
    render(<ModelDescriptionField notifyModelDescriptionChanged={notifyModelDescriptionChangedHandlerMock} />);

    // WHEN descriptionField changes value
    const givenModelDescription = getTestString(10);
    const descField = screen.getByTestId(DATA_TEST_ID.MODEL_DESC_INPUT);

    // We must use fake timers so that time can progress immediately while the input is debounced.
    await typeDebouncedInput(descField, givenModelDescription);

    // THEN expect the notifyModelDescriptionChangedHandlerMock to have been called once because it is debounced
    expect(notifyModelDescriptionChangedHandlerMock).toHaveBeenCalledTimes(1);

    // AND expect the notifyModelDescriptionChangedHandlerMock to have been called with the correct value
    expect(notifyModelDescriptionChangedHandlerMock).toHaveBeenCalledWith(givenModelDescription);
  });

  test("should correctly notify the notifyModelDescriptionChanged handler when a default value is passed and the user types", async () => {
    // GIVEN a notifyModelDescriptionChanged mock
    const notifyModelDescriptionChangedHandlerMock = jest.fn();
    // AND a default model description
    const givenDefaultModelDescription = getTestString(10);
    // AND that the model description field is rendered
    render(<ModelDescriptionField modelDescription={givenDefaultModelDescription} notifyModelDescriptionChanged={notifyModelDescriptionChangedHandlerMock} />);

    // WHEN the user types in the descriptionField
    const givenModelDescription = getTestString(10);
    const descField = screen.getByTestId(DATA_TEST_ID.MODEL_DESC_INPUT);

    // We must use fake timers so that time can progress immediately while the input is debounced.
    await typeDebouncedInput(descField, givenModelDescription);

    // THEN expect the notifyModelDescriptionChangedHandlerMock to have been called once because it is debounced
    expect(notifyModelDescriptionChangedHandlerMock).toHaveBeenCalledTimes(1);

    // AND expect the notifyModelDescriptionChangedHandlerMock to have been called with the given default value and the new value
    expect(notifyModelDescriptionChangedHandlerMock).toHaveBeenCalledWith(givenDefaultModelDescription + givenModelDescription);
  });

  test("should handle text changes even if notifyModelNameChanged handler is notset and the user types", async () => {
    // GIVEN the model description field is rendered without a notifyModelDescriptionChanged handler
    render(<ModelDescriptionField />);

    // WHEN the user types in the descriptionField
    const givenModelDescription = getTestString(10);
    const descField: HTMLInputElement = screen.getByTestId(DATA_TEST_ID.MODEL_DESC_INPUT);
    await typeDebouncedInput(descField, givenModelDescription);

    // THEN expect inputField to have the new value
    expect(descField.value).toBe(givenModelDescription);
  });
});
