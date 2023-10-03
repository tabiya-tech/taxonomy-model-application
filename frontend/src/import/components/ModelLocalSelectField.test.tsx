// mute the console
import 'src/_test_utilities/consoleMock';

import {render, screen, within} from "src/_test_utilities/test-utils";
import ModelLocalSelectField, {DATA_TEST_ID, TEXT} from "./ModelLocalSelectField";
import Locale from "api-specifications/locale";
import React from "react";
import userEvent from "@testing-library/user-event";

// Given a list of locales
const givenLocales: Locale.Types.Payload[] = [
  {
    UUID: "1",
    shortCode: "ZA",
    name: "South Africa"
  }, {
    UUID: "2",
    shortCode: "KA",
    name: "Kenya"
  }
];
describe("Locale Selector Component render tests", () => {
  beforeEach(() => {
    (console.error as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();
  });

  it("should render the locale selector component", () => {

    // WHEN the modelSelectionComponent is rendered
    render(<ModelLocalSelectField locales={givenLocales}/>)
    const modelLocalSelectField = screen.getByTestId(DATA_TEST_ID.MODEL_LOCALE_SELECT_FIELD);

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND the local selector to be in the document
    expect(modelLocalSelectField).toBeInTheDocument();

    // AND expect the selected value to be the first from the given locales
    const dropdownElement = screen.getByTestId(DATA_TEST_ID.MODEL_LOCALE_DROPDOWN)
    const selectedInput = within(dropdownElement).getByTestId(DATA_TEST_ID.MODEL_LOCALE_INPUT);
    expect(selectedInput).toHaveAttribute("value", givenLocales[0].UUID);

    // AND expect label to be visible
    const label: HTMLLabelElement = screen.getByTestId(DATA_TEST_ID.MODEL_LOCALE_LABEL)
    expect(label).toBeInTheDocument();
    expect(label).toBeVisible();
    // AND expect label to have correct text
    expect(label).toHaveTextContent(TEXT.MODEL_LOCALE_SELECT_LABEL)
  })

  test("multiple components should have a unique id", () => {
    // GIVEN multiple selectFieldComponents are selected
    render(
      <div>
        <ModelLocalSelectField locales={givenLocales}/>
        <ModelLocalSelectField locales={givenLocales}/>
      </div>
    );

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND expect each dropdownElement to have different ids
    const labelElements = screen.getAllByTestId(DATA_TEST_ID.MODEL_LOCALE_LABEL);
    expect(labelElements.length).toBe(2);
    expect(labelElements[0].id).not.toBe(labelElements[1].id);
  });
});

describe("Locale Selector Component actions tests only", () => {
  it("should call the notifyChangeHandler when default selected value", async () => {
    // GIVEN a notifyChangeHandler
    const givenNotifyChangeHandler = jest.fn();

    // AND the modelSelectionComponent is rendered with some model locales
    render(<ModelLocalSelectField locales={givenLocales} notifyModelLocaleChanged={givenNotifyChangeHandler}/>);

    // THEN expect the notifyChangeHandler to be called with the selected locale
    expect(givenNotifyChangeHandler).toHaveBeenLastCalledWith(givenLocales[0]);
  })

  it("should call the notifyChangeHandler when a locale is selected", async () => {
    // GIVEN a notifyChangeHandler
    const givenNotifyChangeHandler = jest.fn();

    // AND the modelSelectionComponent is rendered with some model locales
    render(<ModelLocalSelectField locales={givenLocales} notifyModelLocaleChanged={givenNotifyChangeHandler}/>);

    const dropdownElement = screen.getByTestId(DATA_TEST_ID.MODEL_LOCALE_DROPDOWN)
    const button = within(dropdownElement).getByRole('button');
    await userEvent.click(button);

    // THEN expect the dropdown to be open
    const dropdownList = screen.getAllByTestId(DATA_TEST_ID.MODEL_LOCALE_ITEM);
    expect(dropdownList).toHaveLength(2);

    const secondLocaleElement = dropdownList.find((item) => item.getAttribute('data-value') === givenLocales[1].UUID);
    if(secondLocaleElement){
      await userEvent.click(secondLocaleElement);
    }
    // THEN expect the notifyChangeHandler to be called with the selected locale
    expect(givenNotifyChangeHandler).toHaveBeenLastCalledWith(givenLocales[1]);
  })
})