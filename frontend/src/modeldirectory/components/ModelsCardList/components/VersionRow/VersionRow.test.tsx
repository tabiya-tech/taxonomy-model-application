// mute the console
import "src/_test_utilities/consoleMock";

import { render, screen } from "src/_test_utilities/test-utils";
import userEvent from "@testing-library/user-event";
import VersionRow, {
  DATA_TEST_ID,
  TEXT,
  isSuccessfulExport,
  getLatestExport,
  getLatestSuccessfulExport,
  isImportSuccessful,
} from "./VersionRow";
import {
  getOneDeterministicFakeModel,
  getOneFakeSuccessfulExportProcessState,
} from "src/modeldirectory/_test_utilities/mockModelData";
import { getAllExportProcessStatePermutations } from "src/modeldirectory/components/ExportProcessStateIcon/_test_utilities/exportProcesStateTestData";
import { mockBrowserIsOnLine, unmockBrowserIsOnLine } from "src/_test_utilities/mockBrowserIsOnline";
import ImportProcessStateAPISpecs from "api-specifications/importProcessState";
import ExportProcessStateAPISpecs from "api-specifications/exportProcessState";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import { DATA_TEST_ID as APPROVE_MODAL_DATA_TEST_ID } from "src/theme/ApproveModal/ApproveModal";
import { routerPaths } from "src/app/routerPaths";

// mock the ImportProcessStateIcon component
jest.mock("src/modeldirectory/components/ImportProcessStateIcon/ImportProcessStateIcon", () => {
  const mock = jest.fn(() => {
    return <div data-testid={"mock-ImportProcessState-icon"} />;
  });
  return {
    __esModule: true,
    default: mock,
  };
});

// mock the ExportProcessStateIcon component
jest.mock("src/modeldirectory/components/ExportProcessStateIcon/ExportProcessStateIcon", () => {
  const mock = jest.fn(() => {
    return <div data-testid={"mock-ExportProcessState-icon"} />;
  });
  return {
    __esModule: true,
    ExportProcessStateIcon: mock,
    default: mock,
  };
});

// mock useNavigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

describe("VersionRow", () => {
  const notifyOnExport = jest.fn();
  const notifyOnShowModelDetails = jest.fn();
  const notifyOnExplore = jest.fn();
  const notifyOnRelease = jest.fn();

  function setupVersionRow(overrides: Partial<React.ComponentProps<typeof VersionRow>> = {}) {
    const model = overrides.model ?? getOneDeterministicFakeModel(1);
    render(
      <VersionRow
        model={model}
        isLatest={overrides.isLatest ?? false}
        isModelManager={overrides.isModelManager ?? false}
        notifyOnExport={notifyOnExport}
        notifyOnShowModelDetails={notifyOnShowModelDetails}
        notifyOnExplore={notifyOnExplore}
        notifyOnRelease={notifyOnRelease}
      />
    );
    return model;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    unmockBrowserIsOnLine();
    (console.error as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();
  });

  test("should render the version row with all the common elements", () => {
    // GIVEN a downloadable latest model
    const givenModel = getOneDeterministicFakeModel(1);

    // WHEN the component is rendered
    setupVersionRow({ model: givenModel, isLatest: true });

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();

    // AND expect the row to be shown
    const actualRow = screen.getByTestId(DATA_TEST_ID.VERSION_ROW);
    expect(actualRow).toBeInTheDocument();

    // AND the version to be shown
    expect(screen.getByTestId(DATA_TEST_ID.VERSION_TEXT)).toHaveTextContent(givenModel.version);

    // AND the latest chip to be shown
    expect(screen.getByTestId(DATA_TEST_ID.LATEST_CHIP)).toHaveTextContent(TEXT.LATEST_CHIP_LABEL);

    // AND the locale chip to show the locale short code
    expect(screen.getByTestId(DATA_TEST_ID.LOCALE_CHIP)).toHaveTextContent(givenModel.locale.shortCode);

    // AND the explore, api, csv and show details buttons to be shown
    expect(screen.getByTestId(DATA_TEST_ID.EXPLORE_BUTTON)).toBeInTheDocument();
    expect(screen.getByTestId(DATA_TEST_ID.API_BUTTON)).toBeInTheDocument();
    expect(screen.getByTestId(DATA_TEST_ID.CSV_BUTTON)).toBeInTheDocument();
    expect(screen.getByTestId(DATA_TEST_ID.SHOW_DETAILS_BUTTON)).toBeInTheDocument();

    // AND the row to match the snapshot
    expect(actualRow).toMatchSnapshot();
  });

  test("should show the model name when the version is empty", () => {
    // GIVEN a model with an empty version
    const givenModel = getOneDeterministicFakeModel(1, { version: "" });

    // WHEN the component is rendered
    setupVersionRow({ model: givenModel });

    // THEN expect the model name to be shown
    expect(screen.getByTestId(DATA_TEST_ID.VERSION_TEXT)).toHaveTextContent(givenModel.name);
  });

  test("should not render the latest chip when the model is not the latest", () => {
    // GIVEN a model that is not the latest
    // WHEN the component is rendered
    setupVersionRow({ isLatest: false });

    // THEN expect no latest chip
    expect(screen.queryByTestId(DATA_TEST_ID.LATEST_CHIP)).not.toBeInTheDocument();
  });

  test("should render the release candidate chip for an unreleased model", () => {
    // GIVEN an unreleased model
    const givenModel = getOneDeterministicFakeModel(1, { released: false });

    // WHEN the component is rendered for a user that is not a model manager
    setupVersionRow({ model: givenModel, isModelManager: false });

    // THEN expect the release candidate chip to be shown
    expect(screen.getByTestId(DATA_TEST_ID.RELEASE_CANDIDATE_CHIP)).toHaveTextContent(
      TEXT.RELEASE_CANDIDATE_CHIP_LABEL
    );
  });

  test("should not render the release candidate chip for a released model", () => {
    // GIVEN a released model
    const givenModel = getOneDeterministicFakeModel(1, { released: true });

    // WHEN the component is rendered
    setupVersionRow({ model: givenModel });

    // THEN expect no release candidate chip
    expect(screen.queryByTestId(DATA_TEST_ID.RELEASE_CANDIDATE_CHIP)).not.toBeInTheDocument();
  });

  test("should notify on explore when the explore button is clicked", async () => {
    // GIVEN a rendered version row
    const givenModel = setupVersionRow({});

    // WHEN the explore button is clicked
    await userEvent.click(screen.getByTestId(DATA_TEST_ID.EXPLORE_BUTTON));

    // THEN expect the notifyOnExplore callback to have been called with the model id
    expect(notifyOnExplore).toHaveBeenCalledWith(givenModel.id);
  });

  test("should notify on show model details when the show details button is clicked", async () => {
    // GIVEN a rendered version row
    const givenModel = setupVersionRow({});

    // WHEN the show details button is clicked
    await userEvent.click(screen.getByTestId(DATA_TEST_ID.SHOW_DETAILS_BUTTON));

    // THEN expect the notifyOnShowModelDetails callback to have been called with the model id
    expect(notifyOnShowModelDetails).toHaveBeenCalledWith(givenModel.id);
  });

  test("should render the API button that navigates to the API docs", async () => {
    // GIVEN a rendered version row
    setupVersionRow({});

    // WHEN apiButton is clicked
    const actualApiButton = screen.getByTestId(DATA_TEST_ID.API_BUTTON);
    await userEvent.click(actualApiButton);

    // THEN it should navigate to API docs
    expect(mockNavigate).toHaveBeenCalledWith(routerPaths.API_DOCS);
    // AND clicking it to not notify any other callback
    expect(notifyOnExport).not.toHaveBeenCalled();
    expect(notifyOnShowModelDetails).not.toHaveBeenCalled();
    expect(notifyOnExplore).not.toHaveBeenCalled();
  });

  describe("CSV button", () => {
    test("should render the csv button as a download link of the latest successful export", () => {
      // GIVEN a model with a successful export
      const givenExport = getOneFakeSuccessfulExportProcessState(1);
      givenExport.downloadUrl = "https://download.example.com/some-file.csv.zip";
      const givenModel = getOneDeterministicFakeModel(1, { exportProcessState: [givenExport] });

      // WHEN the component is rendered
      setupVersionRow({ model: givenModel });

      // THEN expect the csv button to be a link to the download url with the filename
      const actualCsvButton = screen.getByTestId(DATA_TEST_ID.CSV_BUTTON);
      expect(actualCsvButton).toHaveAttribute("href", givenExport.downloadUrl);
      expect(actualCsvButton).toHaveAttribute("download", "some-file.csv.zip");
    });

    test("should render the csv button when the export completed with warnings", () => {
      // GIVEN a model whose only export completed with warnings (but no errors)
      const givenExport = getOneFakeSuccessfulExportProcessState(1);
      givenExport.result.exportWarnings = true;
      const givenModel = getOneDeterministicFakeModel(1, { exportProcessState: [givenExport] });

      // WHEN the component is rendered
      setupVersionRow({ model: givenModel });

      // THEN expect the csv button to be shown as a download link
      expect(screen.getByTestId(DATA_TEST_ID.CSV_BUTTON)).toHaveAttribute("href", givenExport.downloadUrl);
    });

    test("should not render the csv or export button for a non model-manager when the model has no successful export", () => {
      // GIVEN a model with no successful export
      const givenModel = getOneDeterministicFakeModel(1, { exportProcessState: [] });

      // WHEN the component is rendered for a user that is not a model manager
      setupVersionRow({ model: givenModel, isModelManager: false });

      // THEN expect neither the csv nor the export button to be shown
      expect(screen.queryByTestId(DATA_TEST_ID.CSV_BUTTON)).not.toBeInTheDocument();
      expect(screen.queryByTestId(DATA_TEST_ID.EXPORT_BUTTON)).not.toBeInTheDocument();
    });
  });

  describe("model manager", () => {
    test("should render the import state icon for a model manager", () => {
      // GIVEN a model
      const givenModel = getOneDeterministicFakeModel(1);

      // WHEN the component is rendered for a model manager
      setupVersionRow({ model: givenModel, isModelManager: true });

      // THEN expect the import state icon to be shown
      expect(screen.getByTestId(DATA_TEST_ID.IMPORT_STATE_ICON_CONTAINER)).toBeInTheDocument();
      expect(screen.getByTestId("mock-ImportProcessState-icon")).toBeInTheDocument();
    });

    test("should not render the import state icon for a user that is not a model manager", () => {
      // GIVEN a model
      // WHEN the component is rendered for a user that is not a model manager
      setupVersionRow({ isModelManager: false });

      // THEN expect no import state icon
      expect(screen.queryByTestId(DATA_TEST_ID.IMPORT_STATE_ICON_CONTAINER)).not.toBeInTheDocument();
    });

    test("should render the export button and notify on export when the model has no successful export", async () => {
      // GIVEN a model with no successful export
      const givenModel = getOneDeterministicFakeModel(1, { exportProcessState: [] });

      // WHEN the component is rendered for a model manager
      setupVersionRow({ model: givenModel, isModelManager: true });

      // THEN expect the export button instead of the csv button
      expect(screen.queryByTestId(DATA_TEST_ID.CSV_BUTTON)).not.toBeInTheDocument();
      const actualExportButton = screen.getByTestId(DATA_TEST_ID.EXPORT_BUTTON);
      expect(actualExportButton).toBeEnabled();

      // AND clicking it to notify with the model id
      await userEvent.click(actualExportButton);
      expect(notifyOnExport).toHaveBeenCalledWith(givenModel.id);
    });

    test("should disable the export button when the browser is offline", () => {
      // GIVEN the browser is offline
      mockBrowserIsOnLine(false);
      // AND a model with no successful export
      const givenModel = getOneDeterministicFakeModel(1, { exportProcessState: [] });

      // WHEN the component is rendered for a model manager
      setupVersionRow({ model: givenModel, isModelManager: true });

      // THEN expect the export button to be disabled
      expect(screen.getByTestId(DATA_TEST_ID.EXPORT_BUTTON)).toBeDisabled();
    });

    test("should disable the export button when the import was not successful", () => {
      // GIVEN a model with no successful export and a pending import
      const givenModel = getOneDeterministicFakeModel(1, { exportProcessState: [] });
      givenModel.importProcessState.status = ImportProcessStateAPISpecs.Enums.Status.PENDING;

      // WHEN the component is rendered for a model manager
      setupVersionRow({ model: givenModel, isModelManager: true });

      // THEN expect the export button to be disabled
      expect(screen.getByTestId(DATA_TEST_ID.EXPORT_BUTTON)).toBeDisabled();
    });

    test("should render the export state icon when the latest export is not successful", () => {
      // GIVEN a model whose only export is not successful
      const givenModel = getOneDeterministicFakeModel(1);
      givenModel.exportProcessState[0].result.errored = true;

      // WHEN the component is rendered for a model manager
      setupVersionRow({ model: givenModel, isModelManager: true });

      // THEN expect the export state icon to be shown
      expect(screen.getByTestId(DATA_TEST_ID.EXPORT_STATE_ICON_CONTAINER)).toBeInTheDocument();
      expect(screen.getByTestId("mock-ExportProcessState-icon")).toBeInTheDocument();
    });

    test("should not render the export state icon when the model has a downloadable export", () => {
      // GIVEN a model with a successful export
      const givenModel = getOneDeterministicFakeModel(1);

      // WHEN the component is rendered for a model manager
      setupVersionRow({ model: givenModel, isModelManager: true });

      // THEN expect no export state icon
      expect(screen.queryByTestId(DATA_TEST_ID.EXPORT_STATE_ICON_CONTAINER)).not.toBeInTheDocument();
    });
  });

  describe("Release button", () => {
    test("should render the release button for a model manager viewing an unreleased model", () => {
      // GIVEN an unreleased model
      const givenModel = getOneDeterministicFakeModel(1, { released: false });

      // WHEN the component is rendered for a model manager
      setupVersionRow({ model: givenModel, isModelManager: true });

      // THEN expect the release button to be shown and enabled
      expect(screen.getByTestId(DATA_TEST_ID.RELEASE_BUTTON)).toBeEnabled();
    });

    test("should not render the release button for a released model", () => {
      // GIVEN a released model
      const givenModel = getOneDeterministicFakeModel(1, { released: true });

      // WHEN the component is rendered for a model manager
      setupVersionRow({ model: givenModel, isModelManager: true });

      // THEN expect no release button
      expect(screen.queryByTestId(DATA_TEST_ID.RELEASE_BUTTON)).not.toBeInTheDocument();
    });

    test("should not render the release button for a user that is not a model manager", () => {
      // GIVEN an unreleased model
      const givenModel = getOneDeterministicFakeModel(1, { released: false });

      // WHEN the component is rendered for a user that is not a model manager
      setupVersionRow({ model: givenModel, isModelManager: false });

      // THEN expect no release button
      expect(screen.queryByTestId(DATA_TEST_ID.RELEASE_BUTTON)).not.toBeInTheDocument();
    });

    test("should disable the release button when the browser is offline", () => {
      // GIVEN the browser is offline
      mockBrowserIsOnLine(false);
      // AND an unreleased model
      const givenModel = getOneDeterministicFakeModel(1, { released: false });

      // WHEN the component is rendered for a model manager
      setupVersionRow({ model: givenModel, isModelManager: true });

      // THEN expect the release button to be disabled
      expect(screen.getByTestId(DATA_TEST_ID.RELEASE_BUTTON)).toBeDisabled();
    });

    test("should not show the confirmation dialog until the release button is clicked", () => {
      // GIVEN an unreleased model
      const givenModel = getOneDeterministicFakeModel(1, { released: false });

      // WHEN the component is rendered for a model manager
      setupVersionRow({ model: givenModel, isModelManager: true });

      // THEN expect no confirmation dialog to be shown
      expect(screen.queryByTestId(APPROVE_MODAL_DATA_TEST_ID.APPROVE_MODEL)).not.toBeInTheDocument();
    });

    test("should show a confirmation dialog when the release button is clicked, and notify on release when confirmed with release notes", async () => {
      // GIVEN an unreleased model
      const givenModel = getOneDeterministicFakeModel(1, { released: false });
      setupVersionRow({ model: givenModel, isModelManager: true });

      // WHEN the release button is clicked
      await userEvent.click(screen.getByTestId(DATA_TEST_ID.RELEASE_BUTTON));

      // THEN expect the confirmation dialog to be shown
      expect(screen.getByTestId(APPROVE_MODAL_DATA_TEST_ID.APPROVE_MODEL_TITLE)).toHaveTextContent(
        TEXT.RELEASE_DIALOG_TITLE
      );

      // AND typing release notes and confirming notifies with the model id and the entered notes
      const givenReleaseNotes = "Some release notes";
      await userEvent.type(screen.getByTestId(DATA_TEST_ID.RELEASE_NOTES_INPUT), givenReleaseNotes);
      await userEvent.click(screen.getByTestId(APPROVE_MODAL_DATA_TEST_ID.APPROVE_MODEL_CONFIRM));

      expect(notifyOnRelease).toHaveBeenCalledWith(givenModel.id, givenReleaseNotes);
      // AND the dialog to be closed afterward
      expect(screen.queryByTestId(APPROVE_MODAL_DATA_TEST_ID.APPROVE_MODEL)).not.toBeInTheDocument();
    });

    test("should notify on release with undefined release notes when none are entered", async () => {
      // GIVEN an unreleased model
      const givenModel = getOneDeterministicFakeModel(1, { released: false });
      setupVersionRow({ model: givenModel, isModelManager: true });

      // WHEN the release button is clicked and confirmed without entering release notes
      await userEvent.click(screen.getByTestId(DATA_TEST_ID.RELEASE_BUTTON));
      await userEvent.click(screen.getByTestId(APPROVE_MODAL_DATA_TEST_ID.APPROVE_MODEL_CONFIRM));

      // THEN expect the callback to be called with undefined release notes
      expect(notifyOnRelease).toHaveBeenCalledWith(givenModel.id, undefined);
    });

    test("should not notify on release when the confirmation dialog is cancelled", async () => {
      // GIVEN an unreleased model
      const givenModel = getOneDeterministicFakeModel(1, { released: false });
      setupVersionRow({ model: givenModel, isModelManager: true });

      // WHEN the release button is clicked and then cancelled
      await userEvent.click(screen.getByTestId(DATA_TEST_ID.RELEASE_BUTTON));
      await userEvent.click(screen.getByTestId(APPROVE_MODAL_DATA_TEST_ID.APPROVE_MODEL_CANCEL));

      // THEN expect the callback to not have been called
      expect(notifyOnRelease).not.toHaveBeenCalled();
      // AND the dialog to be closed
      expect(screen.queryByTestId(APPROVE_MODAL_DATA_TEST_ID.APPROVE_MODEL)).not.toBeInTheDocument();
    });
  });
});

// tests for the export/import state helpers that live in this component
describe("export and import state helpers", () => {
  function isPermutationSuccessful(exportProcessState: ModelInfoTypes.ExportProcessState): boolean {
    return (
      exportProcessState.status === ExportProcessStateAPISpecs.Enums.Status.COMPLETED &&
      !exportProcessState.result.errored &&
      !exportProcessState.result.exportErrors
    );
  }

  function getAllNotSuccessfulExportProcessStates(): ModelInfoTypes.ExportProcessState[] {
    return getAllExportProcessStatePermutations().filter(
      (exportProcessState) => !isPermutationSuccessful(exportProcessState)
    );
  }

  describe("isSuccessfulExport", () => {
    test.each(getAllExportProcessStatePermutations().map((state) => [isPermutationSuccessful(state), state]))(
      "should return %s for %j",
      (expected, givenExportProcessState) => {
        // GIVEN an export process state
        // WHEN isSuccessfulExport is called
        const actual = isSuccessfulExport(givenExportProcessState as ModelInfoTypes.ExportProcessState);

        // THEN expect it to correctly determine whether the export was successful
        expect(actual).toBe(expected);
      }
    );
  });

  describe("getLatestExport", () => {
    test("should return null when the model has no export process states", () => {
      // GIVEN a model without export process states
      const givenModel = getOneDeterministicFakeModel(1, { exportProcessState: [] });

      // WHEN getLatestExport is called
      // THEN expect null to be returned
      expect(getLatestExport(givenModel)).toBeNull();
    });

    test("should return the most recent export regardless of its outcome", () => {
      // GIVEN a model with an older successful export and a newer failed export, out of order in the array
      const givenOlderSuccessfulExport = getOneFakeSuccessfulExportProcessState(1);
      givenOlderSuccessfulExport.timestamp = new Date("2023-06-01T00:00:00.000Z");
      const givenNewerFailedExport = getAllNotSuccessfulExportProcessStates()[0];
      givenNewerFailedExport.timestamp = new Date("2023-06-02T00:00:00.000Z");
      const givenModel = getOneDeterministicFakeModel(1, {
        exportProcessState: [givenOlderSuccessfulExport, givenNewerFailedExport],
      });

      // WHEN getLatestExport is called
      // THEN expect the newest export to be returned even though it failed
      expect(getLatestExport(givenModel)).toBe(givenNewerFailedExport);
    });
  });

  describe("getLatestSuccessfulExport", () => {
    test("should return null when the model has no export process states", () => {
      // GIVEN a model without export process states
      const givenModel = getOneDeterministicFakeModel(1, { exportProcessState: [] });

      // WHEN getLatestSuccessfulExport is called
      // THEN expect null to be returned
      expect(getLatestSuccessfulExport(givenModel)).toBeNull();
    });

    test("should return null when no export was successful", () => {
      // GIVEN a model with only unsuccessful export process states
      const givenModel = getOneDeterministicFakeModel(1, {
        exportProcessState: getAllNotSuccessfulExportProcessStates(),
      });

      // WHEN getLatestSuccessfulExport is called
      // THEN expect null to be returned
      expect(getLatestSuccessfulExport(givenModel)).toBeNull();
    });

    test("should return the most recent successful export even when a later export failed", () => {
      // GIVEN a model with a successful export followed (by timestamp) by a failed one
      const givenSuccessfulExport = getOneFakeSuccessfulExportProcessState(1);
      givenSuccessfulExport.timestamp = new Date("2023-06-01T00:00:00.000Z");
      const givenFailedExport = getAllNotSuccessfulExportProcessStates()[0];
      givenFailedExport.timestamp = new Date("2023-06-02T00:00:00.000Z");
      const givenModel = getOneDeterministicFakeModel(1, {
        exportProcessState: [givenFailedExport, givenSuccessfulExport],
      });

      // WHEN getLatestSuccessfulExport is called
      // THEN expect the successful export to be returned
      expect(getLatestSuccessfulExport(givenModel)).toBe(givenSuccessfulExport);
    });

    test("should return the most recent successful export when there are multiple successful ones", () => {
      // GIVEN a model with two successful exports out of (timestamp) order in the array
      const givenOlderExport = getOneFakeSuccessfulExportProcessState(1);
      givenOlderExport.timestamp = new Date("2023-06-01T00:00:00.000Z");
      const givenNewerExport = getOneFakeSuccessfulExportProcessState(2);
      givenNewerExport.timestamp = new Date("2023-06-02T00:00:00.000Z");
      const givenModel = getOneDeterministicFakeModel(1, {
        exportProcessState: [givenNewerExport, givenOlderExport],
      });

      // WHEN getLatestSuccessfulExport is called
      // THEN expect the most recent successful export to be returned
      expect(getLatestSuccessfulExport(givenModel)).toBe(givenNewerExport);
    });

    test("should return null when the successful export has no download url", () => {
      // GIVEN a model whose only successful export has an empty download url
      const givenExport = getOneFakeSuccessfulExportProcessState(1);
      givenExport.downloadUrl = "";
      const givenModel = getOneDeterministicFakeModel(1, { exportProcessState: [givenExport] });

      // WHEN getLatestSuccessfulExport is called
      // THEN expect null to be returned
      expect(getLatestSuccessfulExport(givenModel)).toBeNull();
    });
  });

  describe("isImportSuccessful", () => {
    test.each([
      [true, ImportProcessStateAPISpecs.Enums.Status.COMPLETED, false],
      [false, ImportProcessStateAPISpecs.Enums.Status.COMPLETED, true],
      [false, ImportProcessStateAPISpecs.Enums.Status.PENDING, false],
      [false, ImportProcessStateAPISpecs.Enums.Status.RUNNING, false],
    ])("should return %s for status %s and errored %s", (expected, givenStatus, givenErrored) => {
      // GIVEN a model with the given import process state
      const givenModel = getOneDeterministicFakeModel(1);
      givenModel.importProcessState.status = givenStatus;
      givenModel.importProcessState.result.errored = givenErrored;

      // WHEN isImportSuccessful is called
      // THEN expect it to correctly determine whether the import was successful
      expect(isImportSuccessful(givenModel)).toBe(expected);
    });
  });
});
