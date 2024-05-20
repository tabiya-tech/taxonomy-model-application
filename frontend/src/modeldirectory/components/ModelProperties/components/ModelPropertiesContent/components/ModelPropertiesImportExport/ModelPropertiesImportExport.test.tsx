// mute the console
import "src/_test_utilities/consoleMock";

import { fakeModel } from "src/modeldirectory/components/ModelsTable/_test_utilities/mockModelData";
import { render, screen } from "src/_test_utilities/test-utils";
import ModelPropertiesImportExport, {
  DATA_TEST_ID as MODEL_PROPERTIES_DATA_TEST_ID,
} from "./ModelPropertiesImportExport";
import ImportTimeline, { DATA_TEST_ID as IMPORT_TIMELINE_DATA_TEST_ID } from "./ImportTimeline/ImportTimeline";
import ExportTimeline, { DATA_TEST_ID as EXPORT_TIMELINE_DATA_TEST_ID } from "./ExportTimeline/ExportTimeline";
import { ALL_USERS, authorizationTests } from "src/_test_utilities/authorizationTests";

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

jest.mock(
  "src/modeldirectory/components/ModelProperties/components/ModelPropertiesContent/components/ModelPropertiesImportExport/ExportTimeline/ExportTimeline",
  () => {
    const actualExportTimeline = jest.requireActual(
      "src/modeldirectory/components/ModelProperties/components/ModelPropertiesContent/components/ModelPropertiesImportExport/ExportTimeline/ExportTimeline"
    );
    const mockExportTimeline = jest
      .fn()
      .mockImplementation(() => (
        <div data-testid={actualExportTimeline.DATA_TEST_ID.EXPORT_TIMELINE}>ExportTimeline</div>
      ));
    return {
      ...actualExportTimeline,
      __esModule: true,
      default: mockExportTimeline,
    };
  }
);

describe("ModelPropertiesImportExport", () => {
  test("Should render import and export correctly with the provided model props", () => {
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
    // AND the export title to be shown
    const actualExportTitle = screen.getByText("Export");
    expect(actualExportTitle).toBeInTheDocument();
    // AND the export timeline to be shown
    const actualExportTimeline = screen.getByTestId(EXPORT_TIMELINE_DATA_TEST_ID.EXPORT_TIMELINE);
    expect(actualExportTimeline).toBeInTheDocument();
    // AND the export timeline to be called with the correct props
    expect(ExportTimeline).toHaveBeenCalledWith(
      {
        exportProcessStates: givenModel.exportProcessState,
      },
      {}
    );
    // AND the import title to be shown
    const actualImportTitle = screen.getByText("Import");
    expect(actualImportTitle).toBeInTheDocument();
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

  describe(
    // eslint-disable-next-line jest/valid-describe-callback,jest/valid-title
    authorizationTests.defaultName,
    authorizationTests.callback({
      name: "ModelPropertiesImportExport",
      Component: <ModelPropertiesImportExport model={fakeModel} />,
      roles: ALL_USERS,
      testIds: [
        MODEL_PROPERTIES_DATA_TEST_ID.IMPORT_EXPORT_TAB,
        EXPORT_TIMELINE_DATA_TEST_ID.EXPORT_TIMELINE,
        IMPORT_TIMELINE_DATA_TEST_ID.IMPORT_TIMELINE,
      ],
    })
  );
});
