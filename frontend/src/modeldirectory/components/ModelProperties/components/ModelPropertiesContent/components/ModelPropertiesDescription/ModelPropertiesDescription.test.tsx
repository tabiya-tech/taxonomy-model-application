// mute the console
import "src/_test_utilities/consoleMock";

import { fakeModel } from "src/modeldirectory/components/ModelsTable/_test_utilities/mockModelData";
import { render, screen } from "src/_test_utilities/test-utils";
import ModelPropertiesDescription, { DATA_TEST_ID } from "./ModelPropertiesDescription";

//mock the TextPropertyField component
jest.mock("src/theme/PropertyFieldLayout/TextPropertyField/TextPropertyField", () => {
  return function ItemDetailsMock(props: { label: string; text: string; "data-testid": string; fieldId: string }) {
    return (
      <div data-testid={props["data-testid"]} id={props.fieldId}>
        <span>{props.label}</span>
        <span>{props.text}</span>
      </div>
    );
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
    // AND locale property to be shown
    const localeComponent = screen.getByTestId(DATA_TEST_ID.MODEL_PROPERTIES_LOCALE);
    expect(localeComponent).toBeInTheDocument();
    // AND the description property to be shown
    const descriptionItem = screen.getByTestId(DATA_TEST_ID.MODEL_PROPERTIES_DESCRIPTION);
    expect(descriptionItem).toBeInTheDocument();
    // AND to match the snapshot
    expect(modelPropertiesDescriptionContainer).toMatchSnapshot();
  });
});
