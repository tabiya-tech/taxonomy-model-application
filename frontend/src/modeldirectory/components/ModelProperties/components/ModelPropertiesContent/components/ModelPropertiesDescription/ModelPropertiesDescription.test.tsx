// mute the console
import "src/_test_utilities/consoleMock";

import { fakeModel } from "src/modeldirectory/components/ModelsTable/_test_utilities/mockModelData";
import { render, screen } from "src/_test_utilities/test-utils";
import ModelPropertiesDescription, { DATA_TEST_ID, FIELD_ID, FIELD_LABEL_TEXT } from "./ModelPropertiesDescription";
import TextPropertyField from "src/theme/PropertyFieldLayout/TextPropertyField/TextPropertyField";

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

describe("ModelPropertiesDescription", () => {
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
    // AND the description property to be shown
    const descriptionItem = screen.getByTestId(DATA_TEST_ID.MODEL_PROPERTIES_DESCRIPTION);
    expect(descriptionItem).toBeInTheDocument();
    // AND the TextPropertyField component to be called with the correct props for the 'Description'
    expect(TextPropertyField).toHaveBeenCalledWith(
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
});
