// mute the console
import "src/_test_utilities/consoleMock";

import { act, render, screen, waitFor } from "src/_test_utilities/test-utils";
import ModelDirectory, { availableLocales, DATA_TEST_ID as MODEL_DIRECTORY_DATA_TEST_ID } from "./ModelDirectory";
import ImportModelDialog, {
  DATA_TEST_ID as IMPORT_DIALOG_DATA_TEST_ID,
  ImportData,
} from "src/import/ImportModelDialog";
import * as React from "react";
import ImportDirectorService from "src/import/importDirector.service";
import { ImportFiles } from "src/import/ImportFiles.type";
import { useSnackbar } from "src/theme/SnackbarProvider/SnackbarProvider";
import { Backdrop, DATA_TEST_ID as BACKDROP_DATA_TEST_ID } from "src/theme/Backdrop/Backdrop";
import ModelsTable, { DATA_TEST_ID as MODELS_TABLE_DATA_TEST_ID } from "./components/modelTables/ModelsTable";
import ModelDirectoryHeader, {
  DATA_TEST_ID as MODEL_DIRECTORY_HEADER_DATA_TEST_ID,
} from "./components/ModelDirectoryHeader/ModelDirectoryHeader";
import ModelInfoService from "src/modelInfo/modelInfo.service";
import ImportAPISpecs from "api-specifications/import";

import {
  getArrayOfRandomModelsMaxLength,
  getOneRandomModelMaxLength,
} from "./components/modelTables/_test_utilities/mockModelData";
import LocaleAPISpecs from "api-specifications/locale";

// mock the model info service, as we do not want the real service to be called during testing
jest.mock("src/modelInfo/modelInfo.service", () => {
  // Mocking the ES5 class
  const mockModelInfoService = jest.fn(); // the constructor
  mockModelInfoService.prototype.createModel = jest.fn(); // adding a mock method
  mockModelInfoService.prototype.getAllModels = jest.fn(); // adding a mock method
  mockModelInfoService.prototype.fetchAllModelsPeriodically = jest.fn(); // adding a mock method
  return mockModelInfoService;
});

// mock the import director service
jest.mock("src/import/importDirector.service", () => {
  // Mocking the ES5 class
  const mockDirectorService = jest.fn(); // the constructor
  mockDirectorService.prototype.directImport = jest.fn(); // adding a mock method
  return mockDirectorService;
});

// mock the snackbar
jest.mock("src/theme/SnackbarProvider/SnackbarProvider", () => {
  const actual = jest.requireActual("src/theme/SnackbarProvider/SnackbarProvider");
  return {
    ...actual,
    __esModule: true,
    useSnackbar: jest.fn().mockReturnValue({
      enqueueSnackbar: jest.fn(),
    }),
  };
});

// mock the Backdrop
jest.mock("src/theme/Backdrop/Backdrop", () => {
  const actual = jest.requireActual("src/theme/Backdrop/Backdrop");
  const mockBackDrop = jest.fn().mockImplementation(() => {
    return <div data-testid={actual.DATA_TEST_ID.BACKDROP_CONTAINER}> My BackDrop Mock</div>;
  });

  return {
    ...actual,
    __esModule: true,
    Backdrop: mockBackDrop,
  };
});

// mock the ImportModelDialog
jest.mock("src/import/ImportModelDialog", () => {
  const actual = jest.requireActual("../import/ImportModelDialog");
  const mockImportDialog = jest.fn().mockImplementation(() => {
    return <div data-testid={actual.DATA_TEST_ID.IMPORT_MODEL_DIALOG}> My Import Dialog Mock</div>;
  });

  return {
    ...actual,
    __esModule: true,
    default: mockImportDialog,
  };
});

// mock the ModelsTable
jest.mock("src/modeldirectory/components/modelTables/ModelsTable", () => {
  const actual = jest.requireActual("src/modeldirectory/components/modelTables/ModelsTable");
  const mockModelsTable = jest.fn().mockImplementation(() => {
    return <div data-testid={actual.DATA_TEST_ID.MODELS_TABLE_ID}> My Models Table</div>;
  });

  return {
    ...actual,
    __esModule: true,
    default: mockModelsTable,
  };
});

// mock the ModelDirectoryHeader
jest.mock("src/modeldirectory/components/ModelDirectoryHeader/ModelDirectoryHeader", () => {
  const actual = jest.requireActual("src/modeldirectory/components/ModelDirectoryHeader/ModelDirectoryHeader");
  const mockModelsTable = jest.fn().mockImplementation(() => {
    return <div data-testid={actual.DATA_TEST_ID.MODEL_DIRECTORY_HEADER}>My Model Directory Header</div>;
  });

  return {
    ...actual,
    __esModule: true,
    default: mockModelsTable,
  };
});

function getTestImportData(): ImportData {
  // model name
  const name = "My Model";
  // model description
  const description = "My Model Description";
  // the import files
  const selectedFiles: ImportFiles = {};
  Object.values(ImportAPISpecs.Constants.ImportFileTypes).forEach(
    (fileType: ImportAPISpecs.Constants.ImportFileTypes) => {
      selectedFiles[fileType] = new File(["foo bits"], `My File-${fileType}`, { type: "text/plain" });
    }
  );

  //The locale
  const locale: LocaleAPISpecs.Types.Payload = {
    UUID: "8e763c32-4c21-449c-94ee-7ddeb379369a",
    name: "South Africa",
    shortCode: "ZA",
  };
  return { name, description, locale, selectedFiles };
}

describe("ModelDirectory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    ModelInfoService.prototype.fetchAllModelsPeriodically = jest.fn();
  });

  afterEach(() => {
    // run the timers so that the timers are cleared before the next test
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe("ModelDirectory Render", () => {
    test("ModelDirectory initial render tests", async () => {
      // GIVEN the model info service fetchPeriodically will resolve with some data and call the callback provided by the modeldirectory with that data
      const givenMockData = ["foo"] as any;
      jest.spyOn(ModelInfoService.prototype, "fetchAllModelsPeriodically").mockImplementation((onSuccess, _) => {
        onSuccess(givenMockData);
        return 1 as unknown as NodeJS.Timer;
      });

      // WHEN the ModelDirectory is mounted
      render(<ModelDirectory />);

      // THEN expect no errors or warning to have occurred
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      // AND  expect the ModelDirectoryHeader to be visible
      const modelDirectoryHeader = screen.getByTestId(MODEL_DIRECTORY_HEADER_DATA_TEST_ID.MODEL_DIRECTORY_HEADER);
      expect(modelDirectoryHeader).toBeInTheDocument();

      // AND the modelDirectoryHeader should receive the onModelImport callback
      expect(ModelDirectoryHeader).toHaveBeenNthCalledWith(1, { onModelImport: expect.any(Function) }, {});

      // AND expect the ModelsTable to be visible
      const modelsTable = screen.getByTestId(MODELS_TABLE_DATA_TEST_ID.MODELS_TABLE_ID);
      expect(modelsTable).toBeInTheDocument();

      // AND the ModelsTable should receive the correct default props.
      expect(ModelsTable).toHaveBeenNthCalledWith(1, { models: [], isLoading: true }, {});

      // AND WHEN the ModelInfoService resolves
      await waitFor(() => {
        // THEN expect the ModelInfoService to have been called
        expect(ModelInfoService.prototype.fetchAllModelsPeriodically).toHaveBeenCalled();
      });
      // AND the ModelsTable should re-render with the resolved data and the loading prop should be set to false
      await waitFor(() => {
        expect(ModelsTable).toHaveBeenNthCalledWith(2, { models: givenMockData, isLoading: false }, expect.anything());
      });
    });

    test("should re-render the modelTable when new models are fetched", async () => {
      jest.useFakeTimers();
      // GIVEN the model info service fetchPeriodically will resolve with each time with new data
      let counter = 0;
      const callback = jest.fn();
      callback.mockImplementation((onSuccess, _) => {
        counter++;
        const givenMockData = ["foo" + counter] as any;
        onSuccess(givenMockData);
      });

      jest.spyOn(ModelInfoService.prototype, "fetchAllModelsPeriodically").mockImplementation((onSuccess, _) => {
        return setInterval(() => callback(onSuccess, _), 1000);
      });

      // WHEN the ModelDirectory is mounted
      render(<ModelDirectory />);

      // The ModelsTable should be rendered with the default props
      expect(ModelsTable).toHaveBeenNthCalledWith(1, { models: [], isLoading: true }, {});
      // AND the ModelsTable should be rendered succeeds at first
      jest.advanceTimersToNextTimer();
      await waitFor(() => {
        expect(ModelsTable).toHaveBeenNthCalledWith(2, { models: ["foo1"], isLoading: false }, {});
      });
      await waitFor(() => {
        expect(ModelsTable).toHaveBeenNthCalledWith(3, { models: ["foo2"], isLoading: false }, {});
      });
    });

    test("should not re-render the modelTable when the models fetched are the same as the previous", async () => {
      jest.useFakeTimers();
      // GIVEN the model info service fetchPeriodically will resolve with each time with the same data
      const callback = jest.fn();
      callback.mockImplementation((onSuccess, _) => {
        const givenMockData = ["foo"] as any;
        onSuccess(givenMockData);
      });

      jest.spyOn(ModelInfoService.prototype, "fetchAllModelsPeriodically").mockImplementation((onSuccess, _) => {
        return setInterval(() => callback(onSuccess, _), 1000);
      });

      // WHEN the ModelDirectory is mounted
      render(<ModelDirectory />);

      // The ModelsTable should be rendered with the default props
      expect(ModelsTable).toHaveBeenNthCalledWith(1, { models: [], isLoading: true }, {});

      // AND the ModelsTable should be rendered with the data returned by the ModelInfoService
      jest.advanceTimersToNextTimer();
      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(1);
      });
      await waitFor(() => {
        expect(ModelsTable).toHaveBeenNthCalledWith(2, { models: ["foo"], isLoading: false }, {});
      });

      // AND the ModelsTable should not be re-rendered when the ModelInfoService returns the same data

      //  let the timer run and to fetch the data again
      jest.advanceTimersToNextTimer();
      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(2);
      });
      //  let the timer run and to fetch the data again
      //  this time new data is returned
      callback.mockImplementationOnce((onSuccess, _) => {
        const givenMockData = ["bar"] as any;
        onSuccess(givenMockData);
      });
      jest.advanceTimersToNextTimer();
      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(3);
      });
      // now the ModelsTable should be re-rendered with the new data for a total of 3 times ( it was not re-rendered when the same data was returned)
      await waitFor(() => {
        expect(ModelsTable).toHaveBeenNthCalledWith(3, { models: ["bar"], isLoading: false }, {});
      });
    });

    test("should show the error message when data fetching fails while the table is loading for the first time", async () => {
      // GIVEN the model info service will fail with some error
      const givenError = new Error("foo");
      jest.spyOn(ModelInfoService.prototype, "fetchAllModelsPeriodically").mockImplementation((_, onError) => {
        onError(givenError);
        return 1 as unknown as NodeJS.Timer;
      });

      // WHEN the ModelDirectory is mounted
      render(<ModelDirectory />);

      // AND  expect the ModelsTable to be visible
      const modelsTable = screen.getByTestId(MODELS_TABLE_DATA_TEST_ID.MODELS_TABLE_ID);
      expect(modelsTable).toBeInTheDocument();
      // AND the ModelsTable should receive the correct default props.
      expect(ModelsTable).toHaveBeenCalledWith({ models: [], isLoading: true }, {});

      // AND WHEN the ModelInfoService fails
      await waitFor(() => {
        // THEN expect a snackbar with the error message to be shown
        expect(useSnackbar().enqueueSnackbar).toHaveBeenCalledWith(
          `Failed to fetch the models. Please check your internet connection.`,
          { variant: "error" }
        );
      });
      // AND the ModelsTable props to remain the same
      expect(ModelsTable).toHaveBeenCalledWith({ models: [], isLoading: true }, {});
      // AND the ModelsTable should not be re-rendered
      expect(ModelsTable).toHaveBeenCalledTimes(1);
    });

    test("should show the table with the previous data and the error message when data fetching fails after it has succeed once", async () => {
      // GIVEN the model info service will succeed and return some data then fails with some error at the second call
      jest.useFakeTimers();
      const givenMockData = ["foo"] as any;
      const callback = jest.fn();
      callback
        .mockImplementationOnce((onSuccess, _) => {
          onSuccess(givenMockData);
        })
        .mockImplementationOnce((_, onError) => {
          onError(new Error("foo"));
        });
      jest.spyOn(ModelInfoService.prototype, "fetchAllModelsPeriodically").mockImplementation((onSuccess, _) => {
        return setInterval(() => callback(onSuccess, _), 1000);
      });

      // WHEN the ModelDirectory is mounted
      render(<ModelDirectory />);

      // THEN expect no errors or warning to have occurred
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      // AND expect the ModelsTable to be visible
      const modelsTable = screen.getByTestId(MODELS_TABLE_DATA_TEST_ID.MODELS_TABLE_ID);
      expect(modelsTable).toBeInTheDocument();
      // AND the ModelsTable should receive the correct default props
      expect(ModelsTable).toHaveBeenNthCalledWith(1, { models: [], isLoading: true }, {});
      // AND WHEN the ModelInfoService succeeds at first
      jest.advanceTimersToNextTimer();
      await waitFor(() => {
        // THEN expect the ModelsTable to have been called with the correct props
        expect(ModelsTable).toHaveBeenNthCalledWith(2, { models: givenMockData, isLoading: false }, expect.anything());
      });
      // AND WHEN the ModelInfoService fails
      jest.advanceTimersToNextTimer();
      await waitFor(() => {
        // THEN expect a snackbar with the error message to be shown
        expect(useSnackbar().enqueueSnackbar).toHaveBeenCalledWith(
          `Failed to fetch the models. Please check your internet connection.`,
          { variant: "error" }
        );
      });
      // AND the ModelsTable to have been called with the previous props
      expect(ModelsTable).toHaveBeenLastCalledWith({ models: givenMockData, isLoading: false }, {});
    });

    test("should clear all the the timers created when the ModelDirectory is unmounted", async () => {
      jest.useFakeTimers();
      // GIVEN the model info service is called periodically, and it will return different data each time
      // causing a new timer to be created each time (see the comments in the implementation in ModelDirectory.tsx)
      let counter = 0;
      const callback = jest.fn();
      callback.mockImplementation((onSuccess, _) => {
        counter++;
        const givenMockData = ["foo" + counter] as any;
        onSuccess(givenMockData);
      });

      const timerIds: NodeJS.Timer[] = [] as unknown as NodeJS.Timer[];
      const fetchAllModelsPeriodicallySpy = jest
        .spyOn(ModelInfoService.prototype, "fetchAllModelsPeriodically")
        .mockImplementation((onSuccess, _) => {
          const timerId = setInterval(() => callback(onSuccess, _), 1000);
          timerIds.push(timerId);
          return timerId;
        });

      const clearIntervalSpy = jest.spyOn(global, "clearInterval");

      // WHEN the ModelDirectory is mounted
      const { unmount, container } = render(<ModelDirectory />);

      // THEN expect no errors or warning to have occurred
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      // AND  expect the ModelDirectory to be visible
      const actualModelDirectory = screen.getByTestId(MODEL_DIRECTORY_DATA_TEST_ID.MODEL_DIRECTORY_PAGE);
      expect(container).toBeInTheDocument();
      // AND expect the model info service to have been called twice (once when the component is mounted and once when the timer fires)
      jest.advanceTimersToNextTimer();
      await waitFor(() => {
        expect(fetchAllModelsPeriodicallySpy).toHaveBeenCalledTimes(2);
      });
      expect(timerIds.length).toBe(2);

      // AND WHEN the model info service is called for the third time
      jest.advanceTimersToNextTimer();
      await waitFor(() => {
        expect(fetchAllModelsPeriodicallySpy).toHaveBeenCalledTimes(3);
      });
      // THEN expect a new timer to have been created
      expect(timerIds.length).toBe(3);

      // AND WHEN the ModelDirectory is unmounted
      unmount();
      // THEN expect the ModelDirectory to not be visible
      expect(actualModelDirectory).not.toBeInTheDocument();
      // AND expect all the timer to have been cleared
      expect(clearIntervalSpy).toHaveBeenCalledTimes(timerIds.length);
      timerIds.forEach((timerId) => {
        expect(clearIntervalSpy).toHaveBeenCalledWith(timerId);
      });

      // at the end of the test, the clearInterval spy otherwise the following tests will fail with the error
      //  clearInterval is not defined
      //  ReferenceError: clearInterval is not defined
      clearIntervalSpy.mockRestore();
    });
  });

  describe("ModelDirectory.ImportDialog action tests", () => {
    test("should show ImportDialog when import button is clicked", () => {
      // GIVEN the ModelDirectory is rendered
      render(<ModelDirectory />);

      // WHEN the user click the import button
      act(() => {
        (ModelDirectoryHeader as jest.Mock).mock.lastCall[0].onModelImport();
      });

      // THEN expect the ImportDialog to be visible
      const importDialog = screen.getByTestId(IMPORT_DIALOG_DATA_TEST_ID.IMPORT_MODEL_DIALOG);
      expect(importDialog).toBeVisible();

      // AND expect the import dialog to have been called with the correct props
      expect(ImportModelDialog).toHaveBeenCalledWith(
        expect.objectContaining({
          availableLocales: availableLocales,
          notifyOnClose: expect.any(Function),
        }),
        {}
      );
    });

    test("should close ImportDialog and not import the model when cancel button is clicked", () => {
      // GIVEN the ModelDirectory is rendered
      render(<ModelDirectory />);

      // AND the user clicks the import button
      act(() => {
        (ModelDirectoryHeader as jest.Mock).mock.lastCall[0].onModelImport();
      });

      // AND the ImportDialog is shown
      expect(screen.getByTestId(IMPORT_DIALOG_DATA_TEST_ID.IMPORT_MODEL_DIALOG)).toBeVisible();

      // AND the user clicks on cancel
      act(() => {
        const mock = (ImportModelDialog as jest.Mock).mock;
        mock.lastCall[0].notifyOnClose({ name: "CANCEL" });
      });

      // THEN expect the ImportDialog to be rendered as closed
      expect(screen.queryByTestId(IMPORT_DIALOG_DATA_TEST_ID.IMPORT_MODEL_DIALOG)).toBeNull();

      // AND expect the import director service to not have been called
      expect(ImportDirectorService.prototype.directImport).toHaveBeenCalledTimes(0);

      // AND the backdrop was not shown
      expect(Backdrop).toHaveBeenCalledTimes(0);
    });

    test("should close the Import Dialog and import the model when the user clicks the import button", async () => {
      // GIVEN the ModelDirectory is rendered
      render(<ModelDirectory />);

      // AND the import will succeed and a new model will be created
      const givenNewModel = getOneRandomModelMaxLength();
      ImportDirectorService.prototype.directImport = jest.fn().mockResolvedValueOnce(givenNewModel);

      // AND the user clicked the import button
      act(() => {
        (ModelDirectoryHeader as jest.Mock).mock.lastCall[0].onModelImport();
      });

      // AND the ImportDialog is shown
      expect(screen.getByTestId(IMPORT_DIALOG_DATA_TEST_ID.IMPORT_MODEL_DIALOG)).toBeVisible();

      // WHEN the user has entered all the data required for the import
      const givenImportData = getTestImportData();

      // AND the user clicks on import
      act(() => {
        const mock = (ImportModelDialog as jest.Mock).mock;
        mock.lastCall[0].notifyOnClose({
          name: "IMPORT",
          importData: givenImportData,
        });
      });

      // THEN expect the ImportDialog to be rendered as closed
      expect(screen.queryByTestId(IMPORT_DIALOG_DATA_TEST_ID.IMPORT_MODEL_DIALOG)).toBeNull();

      // AND the backdrop was shown
      expect(Backdrop).toHaveBeenNthCalledWith(1, { isShown: true, message: expect.any(String) }, {});

      // AND expect the import director service to have been called with the data entered by the user
      expect(ImportDirectorService.prototype.directImport).toHaveBeenCalledWith(
        givenImportData.name,
        givenImportData.description,
        givenImportData.locale,
        givenImportData.selectedFiles
      );

      // AND expect the ModelsTable to have been called with the new model
      const modelsTable = screen.getByTestId(MODELS_TABLE_DATA_TEST_ID.MODELS_TABLE_ID);
      expect(modelsTable).toBeInTheDocument();
      await waitFor(() => {
        expect(ModelsTable).toHaveBeenCalledWith(
          {
            models: expect.arrayContaining([givenNewModel]),
            isLoading: expect.any(Boolean),
          },
          expect.anything()
        );
      });

      // AND the backdrop was eventually hidden
      await waitFor(() => {
        const backdrop = screen.queryByTestId(BACKDROP_DATA_TEST_ID.BACKDROP_CONTAINER);
        expect(backdrop).not.toBeInTheDocument();
      });

      // AND the snackbar notification was shown
      expect(useSnackbar().enqueueSnackbar).toHaveBeenCalledWith(
        `The model '${givenImportData.name}' import has started.`,
        { variant: "success" }
      );
    });

    test("should throw an error when import director fails to import", async () => {
      // GIVEN the ModelDirectory is rendered
      render(<ModelDirectory />);
      // AND the import will fail
      const mockError = new Error("Import failed");
      let errorWasThrown = false;
      ImportDirectorService.prototype.directImport = jest.fn().mockImplementation(
        () =>
          new Promise((resolve, reject) => {
            errorWasThrown = true;
            reject(mockError);
          })
      );

      // WHEN the user clicks the import button
      act(() => {
        (ModelDirectoryHeader as jest.Mock).mock.lastCall[0].onModelImport();
      });

      // AND the ImportDialog is shown
      expect(screen.getByTestId(IMPORT_DIALOG_DATA_TEST_ID.IMPORT_MODEL_DIALOG)).toBeVisible();

      // AND the user has entered all the data required for the import
      const givenImportData = getTestImportData();

      // AND the user click on import
      act(() => {
        const mock = (ImportModelDialog as jest.Mock).mock;
        mock.lastCall[0].notifyOnClose({
          name: "IMPORT",
          importData: givenImportData,
        });
      });

      // THEN expect the ImportDialog to be rendered as closed
      expect(screen.queryByTestId(IMPORT_DIALOG_DATA_TEST_ID.IMPORT_MODEL_DIALOG)).toBeNull();

      // AND the backdrop was shown
      expect(Backdrop).toHaveBeenNthCalledWith(1, { isShown: true, message: expect.any(String) }, {});

      // AND expect the import director service to have been called with the data entered by the user
      expect(ImportDirectorService.prototype.directImport).toHaveBeenCalledWith(
        givenImportData.name,
        givenImportData.description,
        givenImportData.locale,
        givenImportData.selectedFiles
      );

      // AND the backdrop was eventually hidden
      await waitFor(() => {
        const backdrop = screen.queryByTestId(BACKDROP_DATA_TEST_ID.BACKDROP_CONTAINER);
        expect(backdrop).not.toBeInTheDocument();
      });

      // AND expect the error to be thrown
      expect(errorWasThrown).toBeTruthy();

      // AND the snackbar notification was shown
      expect(useSnackbar().enqueueSnackbar).toHaveBeenCalledWith(
        `The model '${givenImportData.name}' import could not be started. Please try again.`,
        { variant: "error" }
      );
    });

    test.each([
      [" has no existing models", []],
      [" has N existing models", getArrayOfRandomModelsMaxLength(3)],
    ])("should add the new model to the table that %s", async (desc, givenExistingModels) => {
      // GIVEN the ModelDirectory is rendered with some existing models
      jest.spyOn(ModelInfoService.prototype, "fetchAllModelsPeriodically").mockImplementation((onSuccess, _) => {
        onSuccess(givenExistingModels);
        return 1 as unknown as NodeJS.Timer;
      });
      render(<ModelDirectory />);

      // AND the import will succeed and a new model will be created
      const givenNewModel = getOneRandomModelMaxLength();
      ImportDirectorService.prototype.directImport = jest.fn().mockResolvedValueOnce(givenNewModel);

      // WHEN the user clicks the import button
      act(() => {
        (ModelDirectoryHeader as jest.Mock).mock.lastCall[0].onModelImport();
      });

      // AND the ImportDialog is shown
      expect(screen.getByTestId(IMPORT_DIALOG_DATA_TEST_ID.IMPORT_MODEL_DIALOG)).toBeVisible();

      // AND the user has entered all the data required for the import
      const givenImportData = getTestImportData();

      // AND the user clicked on import
      act(() => {
        const mock = (ImportModelDialog as jest.Mock).mock;
        mock.lastCall[0].notifyOnClose({
          name: "IMPORT",
          importData: givenImportData,
        });
      });

      // THEN expect the ModelsTable to have been called with the existing and the new model
      const modelsTable = screen.getByTestId(MODELS_TABLE_DATA_TEST_ID.MODELS_TABLE_ID);
      expect(modelsTable).toBeInTheDocument();
      await waitFor(() => {
        // here we cannot assert toHaveBeenLastCalledWith as we do not know the exact lifecycle of the fetchAllModelsPeriodically callback
        expect(ModelsTable).toHaveBeenCalledWith(
          {
            models: [givenNewModel, ...givenExistingModels],
            isLoading: false,
          },
          expect.anything()
        );
      });
    });
  });
});
