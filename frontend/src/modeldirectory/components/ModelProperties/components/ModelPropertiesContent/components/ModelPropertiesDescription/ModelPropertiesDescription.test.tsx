// mute the console
import "src/_test_utilities/consoleMock";

import { fakeModel } from "src/modeldirectory/_test_utilities/mockModelData";
import { render, screen } from "src/_test_utilities/test-utils";
import ModelPropertiesDescription, { DATA_TEST_ID, FIELD_ID, FIELD_LABEL_TEXT } from "./ModelPropertiesDescription";
import TextPropertyField from "src/theme/PropertyFieldLayout/TextPropertyField/TextPropertyField";
import { ALL_USERS, authorizationTests } from "src/_test_utilities/authorizationTests";
import MarkdownPropertyField from "src/theme/PropertyFieldLayout/MarkdownPropertyField/MarkdownPropertyField";

// mock the TextPropertyField component
jest.mock("src/theme/PropertyFieldLayout/TextPropertyField/TextPropertyField", () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation((props) => (
      <div data-testid={props["data-testid"]} id={props.fieldId}>
        Text Property Field Mock
      </div>
    )),
  };
});

// mock the MarkdownPropertyField component
jest.mock("src/theme/PropertyFieldLayout/MarkdownPropertyField/MarkdownPropertyField", () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation((props) => (
      <div data-testid={props["data-testid"]} id={props.fieldId}>
        Markdown Property Field Mock
      </div>
    )),
  };
});

describe("ModelPropertiesDescription", () => {
  beforeEach(() => {
    (console.error as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();
  });

  test("should render correctly with the provided model props", () => {
    // GIVEN a model
    const givenModel = fakeModel;

    // WHEN the ModelPropertiesDescription is rendered with the given model
    render(<ModelPropertiesDescription model={givenModel} />);

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND the component to be shown
    const modelPropertiesDescriptionContainer = screen.getByTestId(DATA_TEST_ID.MODEL_PROPERTIES_DESCRIPTION_CONTAINER);
    expect(modelPropertiesDescriptionContainer).toBeInTheDocument();
    // AND the name property to be shown
    const nameComponent = screen.getByTestId(DATA_TEST_ID.MODEL_PROPERTIES_NAME);
    expect(nameComponent).toBeInTheDocument();
    // AND the TextPropertyField component to be called with the correct props for the 'Name'
    expect(TextPropertyField).toHaveBeenCalledWith(
      {
        label: FIELD_LABEL_TEXT.LABEL_NAME,
        text: givenModel.name,
        "data-testid": DATA_TEST_ID.MODEL_PROPERTIES_NAME,
        fieldId: FIELD_ID.NAME,
      },
      {}
    );
    // AND locale property to be shown
    const localeComponent = screen.getByTestId(DATA_TEST_ID.MODEL_PROPERTIES_LOCALE);
    expect(localeComponent).toBeInTheDocument();
    // AND the TextPropertyField component to be called with the correct props for the 'Locale'
    expect(TextPropertyField).toHaveBeenCalledWith(
      {
        label: FIELD_LABEL_TEXT.LABEL_LOCALE,
        text: `${givenModel.locale.name}(${givenModel.locale.shortCode})`,
        "data-testid": DATA_TEST_ID.MODEL_PROPERTIES_LOCALE,
        fieldId: FIELD_ID.LOCALE,
      },
      {}
    );
    // AND the available languages property to be shown
    const availableLanguagesComponent = screen.getByTestId(DATA_TEST_ID.MODEL_PROPERTIES_AVAILABLE_LANGUAGES);
    expect(availableLanguagesComponent).toBeInTheDocument();
    // AND the TextPropertyField component to be called with the name of the language, under a singular label
    expect(TextPropertyField).toHaveBeenCalledWith(
      {
        label: FIELD_LABEL_TEXT.LABEL_LANGUAGE,
        text: "English",
        "data-testid": DATA_TEST_ID.MODEL_PROPERTIES_AVAILABLE_LANGUAGES,
        fieldId: FIELD_ID.AVAILABLE_LANGUAGES,
      },
      {}
    );
    // AND the description property to be shown
    const descriptionItem = screen.getByTestId(DATA_TEST_ID.MODEL_PROPERTIES_DESCRIPTION);
    expect(descriptionItem).toBeInTheDocument();
    // AND the TextPropertyField component to be called with the correct props for the 'Description'
    expect(MarkdownPropertyField).toHaveBeenCalledWith(
      {
        label: FIELD_LABEL_TEXT.LABEL_DESCRIPTION,
        text: givenModel.description,
        "data-testid": DATA_TEST_ID.MODEL_PROPERTIES_DESCRIPTION,
        fieldId: FIELD_ID.DESCRIPTION,
      },
      {}
    );
    // AND to match the snapshot
    expect(modelPropertiesDescriptionContainer).toMatchSnapshot();
  });

  test("should show the names of every available language of a multilingual model", () => {
    // GIVEN a model available in English, Amharic and French
    const givenModel = { ...fakeModel, availableLanguages: ["en", "am", "fr"] };

    // WHEN the ModelPropertiesDescription is rendered with the given model
    render(<ModelPropertiesDescription model={givenModel} />);

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND the TextPropertyField component to be called with the names of the languages, in the model's order,
    // under a plural label
    expect(TextPropertyField).toHaveBeenCalledWith(
      {
        label: FIELD_LABEL_TEXT.LABEL_LANGUAGES,
        text: "English, Amharic, French",
        "data-testid": DATA_TEST_ID.MODEL_PROPERTIES_AVAILABLE_LANGUAGES,
        fieldId: FIELD_ID.AVAILABLE_LANGUAGES,
      },
      {}
    );
  });

  describe(
    // eslint-disable-next-line jest/valid-describe-callback,jest/valid-title
    authorizationTests.defaultName,
    authorizationTests.callback({
      name: "ModelPropertiesDescription",
      Component: <ModelPropertiesDescription model={fakeModel} />,
      roles: ALL_USERS,
      testIds: [
        DATA_TEST_ID.MODEL_PROPERTIES_DESCRIPTION_CONTAINER,
        DATA_TEST_ID.MODEL_PROPERTIES_NAME,
        DATA_TEST_ID.MODEL_PROPERTIES_LOCALE,
        DATA_TEST_ID.MODEL_PROPERTIES_AVAILABLE_LANGUAGES,
        DATA_TEST_ID.MODEL_PROPERTIES_DESCRIPTION,
      ],
    })
  );
});
