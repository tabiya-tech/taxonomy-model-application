import {fireEvent, render, screen} from "@testing-library/react";
import ModelNameField, {DATA_TEST_ID, TEXT} from "./ModelNameField";
import {getTestString} from "src/_test_utilities/specialCharacters";
import {isSpecified} from "src/utils/isUnspecified";

describe("Model Name Field Tests only", () => {
  test("should render default state", () => {
    // WHEN the model name field is rendered
    render(<ModelNameField/>);

    // THEN expect inputField to be visible
    const inputField = screen.getByTestId(DATA_TEST_ID.MODEL_NAME_INPUT)
    expect(inputField).toBeInTheDocument();
    expect(inputField).toBeVisible();
    // AND expect the inputField to have a correct id
    expect(isSpecified(inputField.id)).toBe(true);
    // AND expect the infield to have the empty string as value
    expect(inputField).toHaveValue("");
    // AND expect the placeholder to be correct
    expect(inputField).toHaveAttribute("placeholder", TEXT.MODEL_NAME_PLACEHOLDER)
    // AND expect label to be visible
    const label:HTMLLabelElement = screen.getByTestId(DATA_TEST_ID.MODEL_NAME_LABEL)
    expect(label).toBeInTheDocument();
    expect(label).toBeVisible();
    // AND expect label to have correct text
    expect(label).toHaveTextContent(TEXT.MODEL_NAME_LABEL)
    // AND expect label to be linked to inputField
    expect(label).toHaveAttribute("for", inputField.id)
  })

  test("multiple components should have a unique id", () => {
      // WHEN two model name fields are rendered
      render(<ModelNameField/>);
      render(<ModelNameField/>);

      // THEN expect the two inputFields to have different ids
      const inputFields = screen.getAllByTestId(DATA_TEST_ID.MODEL_NAME_INPUT);
      expect(inputFields.length).toBe(2);
      expect(inputFields[0].id).not.toBe(inputFields[1].id);
  });

  test("should correctly notify the notifyModelNameChanged handler", () => {
    // GIVEN a notifyModelNameChangedHandler mock
    const notifyModelNameChangedHandlerMock = jest.fn()

    // AND that the model name field is rendered
    render(<ModelNameField notifyModelNameChanged={notifyModelNameChangedHandlerMock}/>);

    // WHEN inputField changes value
    const givenModelName = getTestString(10)
    const inputField = screen.getByTestId(DATA_TEST_ID.MODEL_NAME_INPUT)
    fireEvent.change(inputField, {
      target: {
        value: givenModelName
      }
    })

    // THEN expect the notifyModelNameChangedHandlerMock to have been called
    expect(notifyModelNameChangedHandlerMock).toHaveBeenCalledTimes(1)
    // AND expect the notifyModelNameChangedHandlerMock to have been called with the correct value
    expect(notifyModelNameChangedHandlerMock).toHaveBeenCalledWith(givenModelName)
  })

  test.todo("should handle text changes even if notifyModelNameChanged handler is notset");
})
