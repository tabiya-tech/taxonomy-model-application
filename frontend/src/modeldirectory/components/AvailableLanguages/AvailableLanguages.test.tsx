// mute the console
import "src/_test_utilities/consoleMock";

import { render, screen, within } from "src/_test_utilities/test-utils";
import AvailableLanguages, { DATA_TEST_ID, TEXT, getLanguageNames } from "./AvailableLanguages";

describe("AvailableLanguages", () => {
  beforeEach(() => {
    (console.error as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();
  });

  test("should render the names of the available languages next to a language icon", () => {
    // GIVEN the languages of a model available in three languages
    const givenAvailableLanguages = ["en", "am", "fr"];

    // WHEN the component is rendered
    render(<AvailableLanguages availableLanguages={givenAvailableLanguages} />);

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND the names of the languages to be shown in the given order
    const actualContainer = screen.getByTestId(DATA_TEST_ID.AVAILABLE_LANGUAGES);
    expect(within(actualContainer).getByTestId(DATA_TEST_ID.AVAILABLE_LANGUAGES_NAMES)).toHaveTextContent(
      /^English, Amharic, French$/
    );
    // AND no label to be shown
    expect(within(actualContainer).queryByTestId(DATA_TEST_ID.AVAILABLE_LANGUAGES_LABEL)).not.toBeInTheDocument();
    // AND the icon to tell screen readers what the names are
    expect(within(actualContainer).getByRole("img", { name: "Languages" })).toHaveAttribute(
      "data-testid",
      DATA_TEST_ID.AVAILABLE_LANGUAGES_ICON
    );
    // AND to match the snapshot
    expect(actualContainer).toMatchSnapshot();
  });

  test("should render the label before the names of the available languages when the label is shown", () => {
    // GIVEN the languages of a model available in two languages
    const givenAvailableLanguages = ["en", "fr"];
    // AND the plural label expected for more than one language
    const expectedLabel = "Languages:";

    // WHEN the component is rendered with the label shown
    render(<AvailableLanguages availableLanguages={givenAvailableLanguages} showLabel />);

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND the label to be shown
    const actualContainer = screen.getByTestId(DATA_TEST_ID.AVAILABLE_LANGUAGES);
    expect(within(actualContainer).getByTestId(DATA_TEST_ID.AVAILABLE_LANGUAGES_LABEL)).toHaveTextContent(
      expectedLabel
    );
    // AND the names of the languages to be shown after the label
    expect(actualContainer).toHaveTextContent(`${expectedLabel}English, French`);
    // AND the icon to be hidden from screen readers, as the label already tells what the names are
    expect(within(actualContainer).getByTestId(DATA_TEST_ID.AVAILABLE_LANGUAGES_ICON)).toHaveAttribute(
      "aria-hidden",
      "true"
    );
    // AND to match the snapshot
    expect(actualContainer).toMatchSnapshot();
  });

  test("should use the singular for the label of a single available language", () => {
    // GIVEN the language of a model available in a single language
    const givenAvailableLanguages = ["en"];

    // WHEN the component is rendered with the label shown
    render(<AvailableLanguages availableLanguages={givenAvailableLanguages} showLabel />);

    // THEN expect the label to be in the singular
    expect(screen.getByTestId(DATA_TEST_ID.AVAILABLE_LANGUAGES_LABEL)).toHaveTextContent(/^Language:$/);
    // AND the name of the language to be shown
    expect(screen.getByTestId(DATA_TEST_ID.AVAILABLE_LANGUAGES_NAMES)).toHaveTextContent(/^English$/);
  });

  test("should use the singular for the icon title of a single available language", () => {
    // GIVEN the language of a model available in a single language
    const givenAvailableLanguages = ["en"];

    // WHEN the component is rendered without the label
    render(<AvailableLanguages availableLanguages={givenAvailableLanguages} />);

    // THEN expect the icon to tell screen readers that the name is a language, in the singular
    expect(screen.getByRole("img", { name: "Language" })).toHaveAttribute(
      "data-testid",
      DATA_TEST_ID.AVAILABLE_LANGUAGES_ICON
    );
  });

  test("should render nothing when there are no available languages", () => {
    // GIVEN no available languages
    const givenAvailableLanguages: string[] = [];

    // WHEN the component is rendered
    const { container } = render(<AvailableLanguages availableLanguages={givenAvailableLanguages} />);

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND nothing to be rendered
    expect(container).toBeEmptyDOMElement();
  });

  test("should use the given data-testid for the container", () => {
    // GIVEN a custom data-testid
    const givenTestId = "foo";

    // WHEN the component is rendered with the given data-testid
    render(<AvailableLanguages availableLanguages={["en", "fr"]} data-testid={givenTestId} />);

    // THEN expect the container to have the given data-testid
    expect(screen.getByTestId(givenTestId)).toHaveTextContent("English, French");
  });
});

describe("TEXT.getLanguagesTitle", () => {
  test.each([
    [1, "Language"],
    [2, "Languages"],
    [5, "Languages"],
  ])("should return the title for %s language(s) as '%s'", (givenCount, expectedTitle) => {
    // GIVEN a number of languages
    // WHEN getting the title
    const actualTitle = TEXT.getLanguagesTitle(givenCount);

    // THEN expect the singular for one language and the plural otherwise
    expect(actualTitle).toBe(expectedTitle);
  });
});

describe("getLanguageNames", () => {
  test("should return the registry names of the languages in the given order", () => {
    // GIVEN the short codes of languages in the registry
    const givenAvailableLanguages = ["fr", "en", "es"];

    // WHEN resolving their names
    const actualNames = getLanguageNames(givenAvailableLanguages);

    // THEN expect the registry names, in the given order
    expect(actualNames).toBe("French, English, Spanish");
  });

  test("should name a language that is not in the registry by its short code", () => {
    // GIVEN a short code of a language that is not in the registry
    const givenShortCode = "xx";

    // WHEN resolving the names
    const actualNames = getLanguageNames(["en", givenShortCode]);

    // THEN expect the unknown language to be named by its short code
    expect(actualNames).toBe(`English, ${givenShortCode}`);
  });

  test("should return an empty string when there are no languages", () => {
    // GIVEN no languages
    // WHEN resolving their names
    const actualNames = getLanguageNames([]);

    // THEN expect an empty string
    expect(actualNames).toBe("");
  });
});
