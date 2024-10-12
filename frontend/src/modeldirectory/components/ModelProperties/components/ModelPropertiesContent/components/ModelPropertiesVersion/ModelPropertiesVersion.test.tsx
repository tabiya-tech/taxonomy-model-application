// mute the console
import "src/_test_utilities/consoleMock";

import { fakeModel } from "src/modeldirectory/components/ModelsTable/_test_utilities/mockModelData";
import { render, screen } from "src/_test_utilities/test-utils";
import ModelPropertiesVersion, { DATA_TEST_ID, FIELD_ID, FIELD_LABEL_TEXT } from "./ModelPropertiesVersion";
import ReleasedPropertyField from "src/theme/PropertyFieldLayout/ReleasedPropertyField/ReleasedPropertyField";
import TextPropertyField from "src/theme/PropertyFieldLayout/TextPropertyField/TextPropertyField";
import { ALL_USERS, authorizationTests } from "src/_test_utilities/authorizationTests";
import * as React from "react";
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

// mock the ReleasedPropertyField component
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
    // AND TextPropertyField component to be called with the correct props for the 'UUID'
    expect(TextPropertyField).toHaveBeenCalledWith(
      {
        label: FIELD_LABEL_TEXT.LABEL_UUID,
        text: givenModel.UUID,
        "data-testid": DATA_TEST_ID.MODEL_PROPERTIES_UUID,
        fieldId: FIELD_ID.UUID,
      },
      {}
    );
    // AND the tabiyaPath property to be shown
    const actualTabiyaPath = screen.getByTestId(DATA_TEST_ID.MODEL_PROPERTIES_TABIYA_PATH);
    expect(actualTabiyaPath).toBeInTheDocument();
    // AND TextPropertyField component to be called with the correct props for the 'tabiyaPath'
    expect(TextPropertyField).toHaveBeenCalledWith(
      {
        label: FIELD_LABEL_TEXT.LABEL_TABIYA_PATH,
        text: givenModel.tabiyaPath,
        "data-testid": DATA_TEST_ID.MODEL_PROPERTIES_TABIYA_PATH,
        fieldId: FIELD_ID.TABIYA_PATH,
      },
      {}
    );
    // AND the path property to be shown
    const actualPath = screen.getByTestId(DATA_TEST_ID.MODEL_PROPERTIES_PATH);
    expect(actualPath).toBeInTheDocument();
    // AND TextPropertyField component to be called with the correct props for the 'path'
    expect(TextPropertyField).toHaveBeenCalledWith(
      {
        label: FIELD_LABEL_TEXT.LABEL_PATH,
        text: givenModel.path,
        "data-testid": DATA_TEST_ID.MODEL_PROPERTIES_PATH,
        fieldId: FIELD_ID.PATH,
      },
      {}
    );
    // AND the version property to be shown
    const actualVersion = screen.getByTestId(DATA_TEST_ID.MODEL_PROPERTIES_VERSION);
    expect(actualVersion).toBeInTheDocument();
    // AND TextPropertyField component to be called with the correct props for the 'version'
    expect(TextPropertyField).toHaveBeenCalledWith(
      {
        label: FIELD_LABEL_TEXT.LABEL_VERSION,
        text: givenModel.version,
        "data-testid": DATA_TEST_ID.MODEL_PROPERTIES_VERSION,
        fieldId: FIELD_ID.VERSION,
      },
      {}
    );
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
    // AND TextPropertyField component to be called with the correct props for the 'release notes'
    expect(MarkdownPropertyField).toHaveBeenCalledWith(
      {
        label: FIELD_LABEL_TEXT.LABEL_RELEASE_NOTES,
        text: givenModel.releaseNotes,
        "data-testid": DATA_TEST_ID.MODEL_PROPERTIES_RELEASE_NOTES,
        fieldId: FIELD_ID.RELEASE_NOTES,
      },
      {}
    );
    // AND the release notes property to be shown
    const actualLicense = screen.getByTestId(DATA_TEST_ID.MODEL_PROPERTIES_LICENSE);
    expect(actualLicense).toBeInTheDocument();
    // AND TextPropertyField component to be called with the correct props for the 'release notes'
    expect(MarkdownPropertyField).toHaveBeenCalledWith(
      {
        label: FIELD_LABEL_TEXT.LABLE_LICENSE,
        text: givenModel.license,
        "data-testid": DATA_TEST_ID.MODEL_PROPERTIES_LICENSE,
        fieldId: FIELD_ID.LICENSE,
      },
      {}
    );
    // AND to match the snapshot
    expect(modelPropertiesVersionContainer).toMatchSnapshot();
  });

  describe(
    // eslint-disable-next-line jest/valid-describe-callback,jest/valid-title
    authorizationTests.defaultName,
    authorizationTests.callback({
      name: "ModelPropertiesVersion",
      Component: <ModelPropertiesVersion model={fakeModel} />,
      roles: ALL_USERS,
      testIds: [
        DATA_TEST_ID.MODEL_PROPERTIES_VERSION_CONTAINER,
        DATA_TEST_ID.MODEL_PROPERTIES_UUID,
        DATA_TEST_ID.MODEL_PROPERTIES_TABIYA_PATH,
        DATA_TEST_ID.MODEL_PROPERTIES_PATH,
        DATA_TEST_ID.MODEL_PROPERTIES_VERSION,
        DATA_TEST_ID.MODEL_PROPERTIES_RELEASED_STATUS,
        DATA_TEST_ID.MODEL_PROPERTIES_RELEASE_NOTES,
        DATA_TEST_ID.MODEL_PROPERTIES_LICENSE,
      ],
    })
  );
});
