// mute the console
import "src/_test_utilities/consoleMock";

import { render, screen } from "src/_test_utilities/test-utils";
import { ImportProcessStateEnums } from "api-specifications/importProcessState/enums";
import ImportProcessStateContent, { FIELD_ID, DATA_TEST_ID } from "./ImportProcessStateContent";
import ImportStatusPropertyField from "../ImportStatusPropertyField/ImportStatusPropertyField";
import DurationPropertyField from "src/theme/PropertyFieldLayout/DurationPropertyField/DurationPropertyField";

// mock the ImportStatusPropertyField component
jest.mock(
  "src/modeldirectory/components/ModelProperties/components/ModelPropertiesContent/components/ModelPropertiesImportExport/ImportTimeline/components/ImportStatusPropertyField/ImportStatusPropertyField",
  () => {
    return {
      __esModule: true,
      default: jest.fn().mockImplementation((props) => (
        <div data-testid={props["data-testid"]} id={props.fieldId}>
          ImportStatusPropertyField Mock
        </div>
      )),
    };
  }
);

// mock the DurationPropertyField component
jest.mock("src/theme/PropertyFieldLayout/DurationPropertyField/DurationPropertyField", () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation((props) => (
      <div data-testid={props["data-testid"]} id={props.fieldId}>
        Duration Property Field Mock
      </div>
    )),
  };
});

describe("ImportProcessStateContent", () => {
  test("should render correctly with the provided props", () => {
    // GIVEN an import process state
    const givenImportProcessState = {
      id: "000000000000000000000001",
      result: {
        errored: true,
        parsingErrors: true,
        parsingWarnings: true,
      },
      status: ImportProcessStateEnums.Status.PENDING,
      createdAt: new Date("Wed, Mar 6, 2024, 11:02 AM"),
    };

    // WHEN the component is rendered
    render(<ImportProcessStateContent importProcessState={givenImportProcessState} />);

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND the component to be shown
    const actualContentContainer = screen.getByTestId(DATA_TEST_ID.IMPORT_PROCESS_STATE_CONTENT);
    expect(actualContentContainer).toBeInTheDocument();
    // AND the ImportStatusPropertyField component to be shown
    const actualImportStatusField = screen.getByTestId(DATA_TEST_ID.IMPORT_STATUS_FIELD);
    expect(actualImportStatusField).toBeInTheDocument();
    // AND the ImportStatusPropertyField to be called with the correct props
    expect(ImportStatusPropertyField).toHaveBeenCalledWith(
      {
        importProcessState: givenImportProcessState,
        fieldId: FIELD_ID.IMPORT_STATUS_FIELD,
        "data-testid": DATA_TEST_ID.IMPORT_STATUS_FIELD,
      },
      {}
    );
    // AND the DurationPropertyField component to be shown
    const actualDurationField = screen.getByTestId(DATA_TEST_ID.IMPORT_DURATION_FIELD);
    expect(actualDurationField).toBeInTheDocument();
    // AND the DurationPropertyField to be called with the correct props
    expect(DurationPropertyField).toHaveBeenCalledWith(
      {
        label: "Duration",
        firstDate: givenImportProcessState.createdAt,
        secondDate: undefined,
        fieldId: FIELD_ID.IMPORT_DURATION_FIELD,
        "data-testid": DATA_TEST_ID.IMPORT_DURATION_FIELD,
      },
      {}
    );
    // AND to match the snapshot
    expect(actualContentContainer).toMatchSnapshot();
  });
});
