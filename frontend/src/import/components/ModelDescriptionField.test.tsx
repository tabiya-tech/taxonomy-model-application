import {fireEvent, render, screen} from "src/_test_utilities/test-utils";
import ModelDescriptionField, {DATA_TEST_ID, TEXT} from "./ModelDescriptionField";
import {getTestString} from "src/_test_utilities/specialCharacters";
import {isSpecified} from "src/utils/isUnspecified";

describe("Model Name Field Tests only", () => {
  test("should render default state", () => {
    // WHEN the model name field is rendered
    render(<ModelDescriptionField/>);

    // THEN expect descriptionField to be visible
    const descField = screen.getByTestId(DATA_TEST_ID.MODEL_DESC_INPUT)
    expect(descField).toBeInTheDocument();
    expect(descField).toBeVisible();
    // AND expect the textarea to have a correct id
    expect(isSpecified(descField.id)).toBe(true);
    // AND expect the textarea to have the empty string as value
    expect(descField).toHaveValue("");
    // AND expect the placeholder to be correct
    expect(descField).toHaveAttribute("placeholder", TEXT.MODEL_DESC_PLACEHOLDER)
    // AND expect label to be visible
    const label: HTMLLabelElement = screen.getByTestId(DATA_TEST_ID.MODEL_DESC_LABEL)
    expect(label).toBeInTheDocument();
    expect(label).toBeVisible();
    // AND expect label to have correct text
    expect(label).toHaveTextContent(TEXT.MODEL_DESC_LABEL)
    // AND expect label to be linked to inputField
    expect(label).toHaveAttribute("for", descField.id)
  })

  test("multiple components should have a unique id", () => {
    // WHEN two model name fields are rendered
    render(<ModelDescriptionField/>);
    render(<ModelDescriptionField/>);

    // THEN expect the two textArea to have different ids
    const textArea = screen.getAllByTestId(DATA_TEST_ID.MODEL_DESC_INPUT);
    expect(textArea.length).toBe(2);
    expect(textArea[0].id).not.toBe(textArea[1].id);
  });

  test("should correctly notify the notifyModelDescriptionChanged handler", () => {
    // GIVEN a notifyModelDescriptionChanged mock
    const notifyModelDescriptionChangedHandlerMock = jest.fn()

    // AND that the model description field is rendered
    render(<ModelDescriptionField notifyModelDescriptionChanged={notifyModelDescriptionChangedHandlerMock}/>);

    // WHEN descriptionField changes value
    const givenModelDescription = getTestString(10)
    const descField = screen.getByTestId(DATA_TEST_ID.MODEL_DESC_INPUT)
    fireEvent.change(descField, {
      target: {
        value: givenModelDescription
      }
    })

    // THEN expect the notifyModelDescriptionChangedHandlerMock to have been called
    expect(notifyModelDescriptionChangedHandlerMock).toHaveBeenCalledTimes(1)
    // AND expect the notifyModelDescriptionChangedHandlerMock to have been called with the correct value
    expect(notifyModelDescriptionChangedHandlerMock).toHaveBeenCalledWith(givenModelDescription)
  })

  test.todo("should handle text changes even if notifyModelNameChanged handler is notset");
})
