// mute the console
import "src/_test_utilities/consoleMock";

import React from "react";
import userEvent from "@testing-library/user-event";
import { render, screen, within } from "src/_test_utilities/test-utils";
import LanguageAPISpecs from "api-specifications/language";
import ModelLanguagesSelectField, { DATA_TEST_ID, LanguagesSource, TEXT } from "./ModelLanguagesSelectField";

describe("ModelLanguagesSelectField render tests", () => {
  beforeEach(() => {
    (console.error as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();
  });

  it("should render the languages selector with the selected languages", () => {
    // GIVEN some selected languages
    const givenSelectedLanguages = ["en", "fr"];

    // WHEN the component is rendered
    render(
      <ModelLanguagesSelectField selectedLanguages={givenSelectedLanguages} source={LanguagesSource.MODEL_INFO} />
    );

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND the component to be in the document
    const actualField = screen.getByTestId(DATA_TEST_ID.MODEL_LANGUAGES_SELECT_FIELD);
    expect(actualField).toBeInTheDocument();
    // AND to match the snapshot
    expect(actualField).toMatchSnapshot();
    // AND the label to be visible with the correct text
    const actualLabel = screen.getByTestId(DATA_TEST_ID.MODEL_LANGUAGES_LABEL);
    expect(actualLabel).toBeVisible();
    expect(actualLabel).toHaveTextContent(TEXT.MODEL_LANGUAGES_SELECT_LABEL);
    // AND the input to hold the selected languages
    const actualInput = screen.getByTestId(DATA_TEST_ID.MODEL_LANGUAGES_INPUT);
    const expectedValue = givenSelectedLanguages.join(",");
    expect(actualInput).toHaveValue(expectedValue);
    // AND the names of the selected languages to be shown
    const expectedDisplayedValue = "English, French";
    expect(screen.getByRole("combobox")).toHaveTextContent(expectedDisplayedValue);
  });

  it.each([
    ["no model info file is selected", LanguagesSource.DEFAULT],
    ["a multi language model info file is selected", LanguagesSource.MODEL_INFO],
    ["a legacy model info file is selected", LanguagesSource.LEGACY_MODEL_INFO],
  ])("should explain where the languages come from when %s", (_description, givenSource) => {
    // GIVEN some selected languages
    const givenSelectedLanguages = [LanguageAPISpecs.Constants.FALLBACK_LANGUAGE.shortCode];

    // WHEN the component is rendered with the given source
    render(<ModelLanguagesSelectField selectedLanguages={givenSelectedLanguages} source={givenSource} />);

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND the helper text to tell where the languages come from
    const actualHelperText = screen.getByTestId(DATA_TEST_ID.MODEL_LANGUAGES_HELPER_TEXT);
    expect(actualHelperText).toHaveTextContent(TEXT.SOURCE[givenSource]);
    // AND the helper text not to be an error
    expect(actualHelperText).not.toHaveClass("Mui-error");
  });

  it("should show an error when no language is selected", () => {
    // GIVEN no selected language
    const givenSelectedLanguages: string[] = [];

    // WHEN the component is rendered
    render(
      <ModelLanguagesSelectField selectedLanguages={givenSelectedLanguages} source={LanguagesSource.MODEL_INFO} />
    );

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND the helper text to be an error asking for at least one language
    const actualHelperText = screen.getByTestId(DATA_TEST_ID.MODEL_LANGUAGES_HELPER_TEXT);
    expect(actualHelperText).toHaveTextContent(TEXT.NO_LANGUAGE_SELECTED_ERROR);
    expect(actualHelperText).toHaveClass("Mui-error");
  });
});

describe("ModelLanguagesSelectField action tests", () => {
  beforeEach(() => {
    (console.error as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();
  });

  it("should offer only the languages of the registry", async () => {
    // GIVEN the component is rendered
    render(<ModelLanguagesSelectField selectedLanguages={["en"]} source={LanguagesSource.DEFAULT} />);

    // WHEN the user opens the dropdown
    const dropdownElement = screen.getByTestId(DATA_TEST_ID.MODEL_LANGUAGES_DROPDOWN);
    await userEvent.click(within(dropdownElement).getByRole("combobox"));

    // THEN expect the options to be the languages of the registry
    const actualOptions = screen.getAllByTestId(DATA_TEST_ID.MODEL_LANGUAGES_ITEM);
    const expectedShortCodes = LanguageAPISpecs.Constants.Languages.map((language) => language.shortCode);
    expect(actualOptions.map((option) => option.getAttribute("data-value"))).toEqual(expectedShortCodes);
    // AND expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("should notify the languages changed handler when the user adds a language", async () => {
    // GIVEN a notify handler
    const givenNotifyHandler = jest.fn();
    // AND the component is rendered with one selected language
    const givenSelectedLanguages = ["en"];
    render(
      <ModelLanguagesSelectField
        selectedLanguages={givenSelectedLanguages}
        source={LanguagesSource.MODEL_INFO}
        notifyModelLanguagesChanged={givenNotifyHandler}
      />
    );

    // WHEN the user selects another language
    const dropdownElement = screen.getByTestId(DATA_TEST_ID.MODEL_LANGUAGES_DROPDOWN);
    await userEvent.click(within(dropdownElement).getByRole("combobox"));
    const givenLanguageToAdd = "fr";
    const actualOption = screen
      .getAllByTestId(DATA_TEST_ID.MODEL_LANGUAGES_ITEM)
      .find((option) => option.getAttribute("data-value") === givenLanguageToAdd);
    await userEvent.click(actualOption as HTMLElement);

    // THEN expect the handler to be notified with both languages
    const expectedLanguages = ["en", "fr"];
    expect(givenNotifyHandler).toHaveBeenCalledWith(expectedLanguages);
    // AND expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("should notify the languages changed handler when the user removes a language", async () => {
    // GIVEN a notify handler
    const givenNotifyHandler = jest.fn();
    // AND the component is rendered with two selected languages
    const givenSelectedLanguages = ["en", "fr"];
    render(
      <ModelLanguagesSelectField
        selectedLanguages={givenSelectedLanguages}
        source={LanguagesSource.MODEL_INFO}
        notifyModelLanguagesChanged={givenNotifyHandler}
      />
    );

    // WHEN the user unselects one of them
    const dropdownElement = screen.getByTestId(DATA_TEST_ID.MODEL_LANGUAGES_DROPDOWN);
    await userEvent.click(within(dropdownElement).getByRole("combobox"));
    const givenLanguageToRemove = "en";
    const actualOption = screen
      .getAllByTestId(DATA_TEST_ID.MODEL_LANGUAGES_ITEM)
      .find((option) => option.getAttribute("data-value") === givenLanguageToRemove);
    await userEvent.click(actualOption as HTMLElement);

    // THEN expect the handler to be notified with the remaining language
    const expectedLanguages = ["fr"];
    expect(givenNotifyHandler).toHaveBeenCalledWith(expectedLanguages);
    // AND expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });
});
