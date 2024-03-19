// mute the console
import "src/_test_utilities/consoleMock";

import { render, screen } from "src/_test_utilities/test-utils";
import ExportProcessStateContent, { FIELD_ID, DATA_TEST_ID } from "./ExportProcessStateContent";
import ExportStatusPropertyField from "../ExportStatusPropertyField/ExportStatusPropertyField";
import DurationPropertyField from "src/theme/PropertyFieldLayout/DurationPropertyField/DurationPropertyField";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import { fakeModel } from "src/modeldirectory/components/ModelsTable/_test_utilities/mockModelData";

// mock the ExportStatusPropertyField component
jest.mock(
  "src/modeldirectory/components/ModelProperties/components/ModelPropertiesContent/components/ModelPropertiesImportExport/ExportTimeline/components/ExportStatusPropertyField/ExportStatusPropertyField.tsx",
  () => {
    return {
      __esModule: true,
      default: jest.fn().mockImplementation((props) => (
        <div data-testid={props["data-testid"]} id={props.fieldId}>
          ExportStatusPropertyField Mock
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

describe("ExportProcessStateContent", () => {
  test("should render correctly with the provided props", () => {
    // GIVEN an export process state
    const givenExportProcessState: ModelInfoTypes.ExportProcessState = fakeModel.exportProcessState[0];

    // WHEN the component is rendered
    render(<ExportProcessStateContent exportProcessState={givenExportProcessState} />);

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND the component to be shown
    const actualContentContainer = screen.getByTestId(DATA_TEST_ID.EXPORT_PROCESS_STATE_CONTENT);
    expect(actualContentContainer).toBeInTheDocument();
    // AND the ExportStatusPropertyField component to be shown
    const actualExportStatusField = screen.getByTestId(DATA_TEST_ID.EXPORT_STATUS_FIELD);
    expect(actualExportStatusField).toBeInTheDocument();
    // AND the ExportStatusPropertyField to be called with the correct props
    expect(ExportStatusPropertyField).toHaveBeenCalledWith(
      {
        exportProcessState: givenExportProcessState,
        fieldId: FIELD_ID.EXPORT_STATUS_FIELD + "-" + givenExportProcessState.id,
        "data-testid": DATA_TEST_ID.EXPORT_STATUS_FIELD,
      },
      {}
    );
    // AND the DurationPropertyField component to be shown
    const actualDurationField = screen.getByTestId(DATA_TEST_ID.EXPORT_DURATION_FIELD);
    expect(actualDurationField).toBeInTheDocument();
    // AND the DurationPropertyField to be called with the correct props
    expect(DurationPropertyField).toHaveBeenCalledWith(
      {
        label: "Duration",
        firstDate: givenExportProcessState.createdAt,
        secondDate: givenExportProcessState.updatedAt,
        fieldId: FIELD_ID.EXPORT_DURATION_FIELD + "-" + givenExportProcessState.id,
        "data-testid": DATA_TEST_ID.EXPORT_DURATION_FIELD,
      },
      {}
    );
    // AND to match the snapshot
    expect(actualContentContainer).toMatchSnapshot();
  });
});
