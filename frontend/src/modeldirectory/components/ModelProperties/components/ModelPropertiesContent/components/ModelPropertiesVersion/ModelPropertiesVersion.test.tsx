// mute the console
import "src/_test_utilities/consoleMock";

import { fakeModel } from "src/modeldirectory/components/ModelsTable/_test_utilities/mockModelData";
import { render, screen } from "src/_test_utilities/test-utils";
import ModelPropertiesVersion, { DATA_TEST_ID, FIELD_ID } from "./ModelPropertiesVersion";
import ReleasedPropertyField from "src/theme/PropertyFieldLayout/ReleasedPropertyField/ReleasedPropertyField";

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

// mock  the ReleasedPropertyField component
jest.mock("src/theme/PropertyFieldLayout/ReleasedPropertyField/ReleasedPropertyField", () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation((props) => (
      <div data-testid={props["data-testid"]} id={props.fieldId}>
        Released Status Mock
      </div>
    )),
  };
});

describe("ModelPropertiesVersion", () => {
  test("should render correctly with the provided model props", () => {
    // GIVEN a model
    const givenModel = fakeModel;

    // WHEN ModelPropertiesVersion is rendered with the given model
    render(<ModelPropertiesVersion model={givenModel} />);

    // THEN expect no errors or warnings to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND the component to be shown
    const modelPropertiesVersionContainer = screen.getByTestId(DATA_TEST_ID.MODEL_PROPERTIES_VERSION_CONTAINER);
    expect(modelPropertiesVersionContainer).toBeInTheDocument();
    // AND the UUID property to be shown
    const actualUUID = screen.getByTestId(DATA_TEST_ID.MODEL_PROPERTIES_UUID);
    expect(actualUUID).toBeInTheDocument();
    // AND the tabiyaPath property to be shown
    const actualTabiyaPath = screen.getByTestId(DATA_TEST_ID.MODEL_PROPERTIES_TABIYA_PATH);
    expect(actualTabiyaPath).toBeInTheDocument();
    // AND the path property to be shown
    const actualPath = screen.getByTestId(DATA_TEST_ID.MODEL_PROPERTIES_PATH);
    expect(actualPath).toBeInTheDocument();
    // AND the version property to be shown
    const actualVersion = screen.getByTestId(DATA_TEST_ID.MODEL_PROPERTIES_VERSION);
    expect(actualVersion).toBeInTheDocument();
    // AND the released property to be shown
    const actualReleased = screen.getByTestId(DATA_TEST_ID.MODEL_PROPERTIES_RELEASED_STATUS);
    expect(actualReleased).toBeInTheDocument();
    // AND the ReleasedPropertyField component to be called with the correct props
    expect(ReleasedPropertyField).toHaveBeenCalledWith(
      {
        released: givenModel.released,
        "data-testid": DATA_TEST_ID.MODEL_PROPERTIES_RELEASED_STATUS,
        fieldId: FIELD_ID.RELEASED_STATUS,
      },
      {}
    );
    // AND the release notes property to be shown
    const actualReleaseNotes = screen.getByTestId(DATA_TEST_ID.MODEL_PROPERTIES_RELEASE_NOTES);
    expect(actualReleaseNotes).toBeInTheDocument();
    // AND to match the snapshot
    expect(modelPropertiesVersionContainer).toMatchSnapshot();
  });
});
