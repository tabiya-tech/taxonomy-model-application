// mute the console
import "src/_test_utilities/consoleMock";

import { fakeModel } from "src/modeldirectory/components/ModelsTable/_test_utilities/mockModelData";
import { render, screen } from "src/_test_utilities/test-utils";
import { DATA_TEST_ID } from "./ModelPropertiesImportExport";
import ModelPropertiesImportExport from "./ModelPropertiesImportExport";
import ImportTimeline from "./ImportTimeline/ImportTimeline";

// mock the ImportTimeline component
jest.mock(
  "src/modeldirectory/components/ModelProperties/components/ModelPropertiesContent/components/ModelPropertiesImportExport/ImportTimeline/ImportTimeline",
  () => {
    return {
      __esModule: true,
      default: jest.fn().mockImplementation((props) => <div data-testid={props["data-testid"]}>ImportTimeline</div>),
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
    const actualImportExportTab = screen.getByTestId(DATA_TEST_ID.IMPORT_EXPORT_TAB);
    expect(actualImportExportTab).toBeInTheDocument();
    // AND the title to be shown
    const actualImportTitle = screen.getByTestId(DATA_TEST_ID.IMPORT_TITLE);
    expect(actualImportTitle).toBeInTheDocument();
    // AND the import timeline to be shown
    const actualImportTimeline = screen.getByTestId(DATA_TEST_ID.IMPORT_TIMELINE);
    expect(actualImportTimeline).toBeInTheDocument();
    // AND the import timeline to be called with the correct props
    expect(ImportTimeline).toHaveBeenCalledWith(
      {
        importProcessState: givenModel.importProcessState,
        "data-testid": DATA_TEST_ID.IMPORT_TIMELINE,
      },
      {}
    );
    // AND to match the snapshot
    // expect(actualImportExportTab).toMatchSnapshot();
  });
});
