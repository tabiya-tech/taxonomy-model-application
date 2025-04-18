// mute the console
import "src/_test_utilities/consoleMock";

import { render, screen } from "src/_test_utilities/test-utils";
import ModelNameField, { DATA_TEST_ID, TEXT } from "./ModelNameField";
import { getTestString } from "src/_test_utilities/specialCharacters";
import { isSpecified } from "src/utils/isUnspecified";
import React from "react";
import { typeDebouncedInput } from "src/_test_utilities/userEventFakeTimer";

describe("ModelNameField render tests", () => {
  beforeEach(() => {
    (console.error as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();
  });

  test("should render default state", () => {
    // WHEN the model name field is rendered
    render(<ModelNameField />);

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND the modelNameField to be visible
    const modelNameField = screen.getByTestId(DATA_TEST_ID.MODEL_NAME_FIELD);
    expect(modelNameField).toBeInTheDocument();
    // AND to match the snapshot
    expect(modelNameField).toMatchSnapshot();
    // AND expect input to be visible
    const input = screen.getByTestId(DATA_TEST_ID.MODEL_NAME_INPUT);
    expect(input).toBeInTheDocument();
    expect(input).toBeVisible();
    // AND expect the input to have a correct id
    expect(isSpecified(input.id)).toBe(true);
    // AND expect the infield to have the empty string as value
    expect(input).toHaveValue("");
    // AND expect the placeholder to be correct
    expect(input).toHaveAttribute("placeholder", TEXT.MODEL_NAME_PLACEHOLDER);
    // AND expect label to be visible
    const label: HTMLLabelElement = screen.getByTestId(DATA_TEST_ID.MODEL_NAME_LABEL);
    expect(label).toBeInTheDocument();
    expect(label).toBeVisible();
    // AND expect label to have correct text
    expect(label).toHaveTextContent(TEXT.MODEL_NAME_LABEL);
    // AND expect label to be linked to input
    expect(label).toHaveAttribute("for", input.id);
  });
});

describe("ModelNameField action  tests", () => {
  test("should correctly notify the notifyModelNameChanged handler", async () => {
    // GIVEN a notifyModelNameChangedHandler mock
    const givenNotifyModelNameChangedHandler = jest.fn();

    // AND that the model name field is rendered
    render(<ModelNameField notifyModelNameChanged={givenNotifyModelNameChangedHandler} />);

    // WHEN inputField changes value
    const givenModelName = getTestString(10);
    const inputField = screen.getByTestId(DATA_TEST_ID.MODEL_NAME_INPUT);
    await typeDebouncedInput(inputField, givenModelName);

    // THEN expect the givenNotifyModelNameChangedHandler to have been called once because it is debounced
    expect(givenNotifyModelNameChangedHandler).toHaveBeenCalledTimes(1);
    // AND expect the notifyModelNameChangedHandlerMock to have been called with the correct value
    expect(givenNotifyModelNameChangedHandler).toHaveBeenCalledWith(givenModelName);
  });

  test("should handle text changes even if notifyModelNameChanged handler is notset", async () => {
    // GIVEN that the model name field is rendered without a notifyModelNameChanged handler
    render(<ModelNameField />);

    // WHEN the inputField changes value
    const givenModelName = getTestString(10);
    const inputField: HTMLInputElement = screen.getByTestId(DATA_TEST_ID.MODEL_NAME_INPUT);
    await typeDebouncedInput(inputField, givenModelName);

    // THEN expect inputField value tobe the given value
    expect(inputField.value).toBe(givenModelName);
  });
});
