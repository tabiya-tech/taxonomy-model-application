// mute the console
import "src/_test_utilities/consoleMock";

import { fakeModel } from "src/modeldirectory/components/ModelsTable/_test_utilities/mockModelData";
import { render, screen } from "src/_test_utilities/test-utils";
import ModelPropertiesImportExport, {
  DATA_TEST_ID as MODEL_PROPERTIES_DATA_TEST_ID,
} from "./ModelPropertiesImportExport";
import ImportTimeline, { DATA_TEST_ID as IMPORT_TIMELINE_DATA_TEST_ID } from "./ImportTimeline/ImportTimeline";

// mock the ImportTimeline component
jest.mock(
  "src/modeldirectory/components/ModelProperties/components/ModelPropertiesContent/components/ModelPropertiesImportExport/ImportTimeline/ImportTimeline",
  () => {
    const actualImportTimeline = jest.requireActual(
      "src/modeldirectory/components/ModelProperties/components/ModelPropertiesContent/components/ModelPropertiesImportExport/ImportTimeline/ImportTimeline"
    );
    const mockImportTimeline = jest
      .fn()
      .mockImplementation(() => (
        <div data-testid={actualImportTimeline.DATA_TEST_ID.IMPORT_TIMELINE}>ImportTimeline</div>
      ));
    return {
      ...actualImportTimeline,
      __esModule: true,
      default: mockImportTimeline,
    };
  }
);

describe("ModelPropertiesImportExport", () => {
  test("Should render import correctly with the provided model props", () => {
    // GIVEN a model
    const givenModel = fakeModel;

    // WHEN the ModelPropertiesImportExport is rendered with the given model
    render(<ModelPropertiesImportExport model={givenModel} />);

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND the component to be shown
    const actualImportExportTab = screen.getByTestId(MODEL_PROPERTIES_DATA_TEST_ID.IMPORT_EXPORT_TAB);
    expect(actualImportExportTab).toBeInTheDocument();
    // AND the title to be shown
    const actualTitle = screen.getByText("Import");
    expect(actualTitle).toBeInTheDocument();
    // AND the import timeline to be shown
    const actualImportTimeline = screen.getByTestId(IMPORT_TIMELINE_DATA_TEST_ID.IMPORT_TIMELINE);
    expect(actualImportTimeline).toBeInTheDocument();
    // AND the import timeline to be called with the correct props
    expect(ImportTimeline).toHaveBeenCalledWith(
      {
        importProcessState: givenModel.importProcessState,
      },
      {}
    );
    // AND to match the snapshot
    expect(actualImportExportTab).toMatchSnapshot();
  });
});
