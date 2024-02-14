import {ModelPropertiesDrawerProps} from "./ModelPropertiesDrawer";
import ImportProcessStateAPISpecs from "api-specifications/importProcessState";
import * as React from "react";

jest.mock("./components/ModelPropertiesHeader", () => {
  const actual = jest.requireActual("./components/ModelPropertiesHeader");
  const mockModelPropertiesHeader = jest.fn().mockImplementation(() => {
    return <div data-testid={actual.DATA_TEST_ID.MODEL_PROPERTIES_HEADER}> Model properties header</div>;
  });
  return {
    ...actual,
    __esModule: true,
    default: mockModelPropertiesHeader,
  };
});
//TODO: reusable test mocker fn beware of import hoising
jest.mock("./components/ModelPropertiesContent", () => {
  const actual = jest.requireActual("./components/ModelPropertiesContent");
  const mockModelPropertiesContent = jest.fn().mockImplementation(() => {
    return <div data-testid={actual.DATA_TEST_ID.MODEL_PROPERTIES_CONTENT}> Model properties content</div>;
  });
  return {
    ...actual,
    __esModule: true,
    default: mockModelPropertiesContent,
  };
});

const testProps: ModelPropertiesDrawerProps = {
  isOpen: true,
  notifyOnClose: jest.fn(),
  model: {
    name: "foo",
    description: "",
    id: "",
    UUID: "",
    UUIDHistory: [],
    released: false,
    releaseNotes: "",
    version: "",
    locale: {
      UUID: "bar",
      shortCode: "bar",
      name: "bar",
    },
    path: "",
    tabiyaPath: "",
    exportProcessState: [],
    importProcessState: {
      id: "",
      status: ImportProcessStateAPISpecs.Enums.Status.PENDING,
      result: {
        errored: false,
        parsingErrors: false,
        parsingWarnings: false,
      },
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

describe("ModelPropertiesDrawer component render tests", () => {
  test.todo("should render the drawer when 'isOpen' is true");
// GIVEN the 'isOpen' prop is true
// WHEN the ModelPropertiesDrawer component is rendered
// THEN it should match the snapshot
// AND the drawer should be in the document
// AND the header should be in the document
// AND the content should be in the document
// AND no errors are logged to the console

  test.todo("should not render the drawer when 'isOpen' is false");
// GIVEN the 'isOpen' prop is false
// WHEN the ModelPropertiesDrawer component is rendered
// THEN the drawer should not be in the document

  test.todo("should call the header component with the appropriate props");
// GIVEN the drawer is open
// WHEN the ModelPropertiesDrawer component is rendered
// THEN the header should have been called with the expected props

  test.todo("should call the content component with the model");
// GIVEN the drawer is open
// WHEN the ModelPropertiesDrawer component is rendered
// THEN the content should have been called with the given model

  //TODO: make test independent of time it takes for the drawer to close and open
});

describe("ModelPropertiesDrawer component action tests", () => {
  test.todo("should call the parent's notifyOnClose with DISMISS when the drawer closes");
// GIVEN the drawer is open
// WHEN the drawer is closed ( spy and call the drawer close callback)
// THEN 'notifyOnClose' should be called with { name: "DISMISS" }

  test.todo("should call parent's notifyOnClose with DISMISS when the header close button is clicked");
// GIVEN the drawer is open
// WHEN the callback function passed to the header is called
// THEN 'notifyOnClose' should be called with { name: "DISMISS" }
});

