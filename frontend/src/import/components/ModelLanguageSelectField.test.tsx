// mute the console
import "src/_test_utilities/consoleMock";

import { render, screen, within } from "src/_test_utilities/test-utils";
import ModelLanguageSelectField, { DATA_TEST_ID, languageEnum, TEXT } from "./ModelLanguageSelectField";
import userEvent from "@testing-library/user-event";

describe("Model Language Select Field Component tests", () => {
  beforeEach(() => {
    (console.error as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();
  });

  // GIVEN some languages
  const givenLanguages = [languageEnum.ENGLISH, languageEnum.FRENCH];

  describe("Model language select Field component render tests", () => {
    test("should render the language select field component", () => {
      // WHEN the modelLanguageSelectField is rendered
      render(<ModelLanguageSelectField languages={givenLanguages} notifyModelLanguageChanged={jest.fn()} />);

      // THEN expect no errors or warning to have occurred
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      // AND the modelSelectComponent to be in the document
      const modelLanguageSelectField = screen.getByTestId(DATA_TEST_ID.MODEL_LANGUAGE_SELECT_FIELD);
      expect(modelLanguageSelectField).toBeInTheDocument();

      // AND expect the selected value to be the first from the given languages
      const dropdownElement = screen.getByTestId(DATA_TEST_ID.MODEL_LANGUAGE_DROPDOWN);
      const selectedInput = within(dropdownElement).getByTestId(DATA_TEST_ID.MODEL_LANGUAGE_INPUT);
      expect(selectedInput).toHaveAttribute("value", givenLanguages[0]);

      // AND expect label to be visible
      const label = screen.getByTestId(DATA_TEST_ID.MODEL_LANGUAGE_LABEL);
      expect(label).toBeInTheDocument();
      expect(label).toBeVisible();
      // AND expect label to have correct text
      expect(label).toHaveTextContent(TEXT.MODEL_LANGUAGE_SELECT_LABEL);

      //  AND to match the snapshot
    });
  });

  describe("Model Language Select Field Component actions tests", () => {
    test("should call the notifyChangeHandler with default value", () => {
      // GIVEN a notifyChangeHandler
      const givenNotifyChangeHandler = jest.fn();

      // WHEN the modelLanguageSelectField is rendered with some languages
      render(
        <ModelLanguageSelectField languages={givenLanguages} notifyModelLanguageChanged={givenNotifyChangeHandler} />
      );

      // THEN expect the notifyChangeHandler to be called with the default language
      expect(givenNotifyChangeHandler).toHaveBeenCalledWith(givenLanguages[0]);
    });

    test("should call the notifyChangeHandler when a language is selected", async () => {
      // GIVEN a notifyChangeHandler
      const givenNotifyChangeHandler = jest.fn();

      // WHEN the modelLanguageSelectField is rendered with some languages
      render(
        <ModelLanguageSelectField languages={givenLanguages} notifyModelLanguageChanged={givenNotifyChangeHandler} />
      );
      // AND a dropdown is clicked
      const dropdownElement = screen.getByTestId(DATA_TEST_ID.MODEL_LANGUAGE_DROPDOWN);
      const button = within(dropdownElement).getByRole("combobox");
      await userEvent.click(button);

      // THEN expect the dropdown to be open
      const dropdownList = screen.getAllByTestId(DATA_TEST_ID.MODEL_LANGUAGE_ITEM);
      expect(dropdownList).toHaveLength(2);
      // AND when the second language is selected
      const secondLanguageElement = dropdownList.find(
        (language) => language.getAttribute("data-value") === givenLanguages[1]
      );
      if (secondLanguageElement) {
        await userEvent.click(secondLanguageElement);
      }
      // AND the notifyChangeHandler to be called with the selected language
      expect(givenNotifyChangeHandler).toHaveBeenLastCalledWith(givenLanguages[1]);
    });
  });
});
