// mute the console
import "src/_test_utilities/consoleMock";

import { act, render, screen, waitFor } from "src/_test_utilities/test-utils";
import ModelDirectory, { DATA_TEST_ID as MODEL_DIRECTORY_DATA_TEST_ID, SNACKBAR_ID } from "./ModelDirectory";
import ImportModelDialog, {
  DATA_TEST_ID as IMPORT_DIALOG_DATA_TEST_ID,
  ImportData,
} from "src/import/ImportModelDialog";
import * as React from "react";
import ImportDirectorService from "src/import/importDirector.service";
import { ImportFiles } from "src/import/ImportFiles.type";
import { useSnackbar } from "src/theme/SnackbarProvider/SnackbarProvider";
import { Backdrop, DATA_TEST_ID as BACKDROP_DATA_TEST_ID } from "src/theme/Backdrop/Backdrop";
import ModelsTable, { DATA_TEST_ID as MODELS_TABLE_DATA_TEST_ID } from "./components/ModelsTable/ModelsTable";
import ModelDirectoryHeader, {
  DATA_TEST_ID as MODEL_DIRECTORY_HEADER_DATA_TEST_ID,
} from "./components/ModelDirectoryHeader/ModelDirectoryHeader";
import ModelInfoService from "src/modelInfo/modelInfo.service";
import ExportService from "src/export/export.service";
import LocalesService from "src/locale/locales.service";
import ImportAPISpecs from "api-specifications/import";

import {
  getArrayOfRandomModelsMaxLength,
  getOneRandomModelMaxLength,
} from "./components/ModelsTable/_test_utilities/mockModelData";
import { getArrayOfFakeLocales } from "src/locale/_test_utilities/mockLocales";
import LocaleAPISpecs from "api-specifications/locale";
import { mockBrowserIsOnLine, unmockBrowserIsOnLine } from "src/_test_utilities/mockBrowserIsOnline";

import { getUserFriendlyErrorMessage, ServiceError } from "src/error/error";
import { writeServiceErrorToLog } from "src/error/logger";
import { ErrorCodes } from "src/error/errorCodes";
import ModelPropertiesDrawer from "./components/ModelProperties/ModelPropertiesDrawer";
import { randomUUID } from "crypto";

import { ALL_USERS, authorizationTests } from "src/_test_utilities/authorizationTests";

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

// mock the locales service
jest.mock("src/locale/locales.service", () => {
  // Mocking the ES5 class
  const mockLocalesService = jest.fn(); // the constructor
  mockLocalesService.prototype.getLocales = jest.fn(); // adding a mock method
  return mockLocalesService;
});

// mock the snackbar
jest.mock("src/theme/SnackbarProvider/SnackbarProvider", () => {
  const actual = jest.requireActual("src/theme/SnackbarProvider/SnackbarProvider");
  return {
    ...actual,
    __esModule: true,
    useSnackbar: jest.fn().mockReturnValue({
      enqueueSnackbar: jest.fn(),
      closeSnackbar: jest.fn(),
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
  const actual = jest.requireActual("src/import/ImportModelDialog");
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
jest.mock("src/modeldirectory/components/ModelsTable/ModelsTable", () => {
  const actual = jest.requireActual("src/modeldirectory/components/ModelsTable/ModelsTable");
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
  const mockModelDirectoryHeader = jest.fn().mockImplementation(() => {
    return <div data-testid={actual.DATA_TEST_ID.MODEL_DIRECTORY_HEADER}>My Model Directory Header</div>;
  });

  return {
    ...actual,
    __esModule: true,
    default: mockModelDirectoryHeader,
  };
});

// mock the ModelPropertiesDrawer
jest.mock("src/modeldirectory/components/ModelProperties/ModelPropertiesDrawer", () => {
  const actual = jest.requireActual("src/modeldirectory/components/ModelProperties/ModelPropertiesDrawer");
  const mockModelPropertiesDrawer = jest.fn().mockImplementation(() => {
    return <div data-testid={actual.DATA_TEST_ID.MODEL_PROPERTIES_DRAWER}>My Model Properties Drawer</div>;
  });

  return {
    ...actual,
    __esModule: true,
    default: mockModelPropertiesDrawer,
  };
});

// mock the writeServiceErrorToLog
jest.mock("src/error/logger", () => {
  const actual = jest.requireActual("src/error/logger");
  const mockWriteServiceErrorToLog = jest.fn().mockImplementation(() => {
    return;
  });

  return {
    ...actual,
    __esModule: true,
    writeServiceErrorToLog: mockWriteServiceErrorToLog,
  };
});

// mock the get user friendly error message
const FRIENDLY_ERROR_MESSAGE = "Friendly error message to the user";
jest.mock("src/error/error", () => {
  const actual = jest.requireActual("src/error/error");
  const mockGetUserFriendlyErrorMessage = jest.fn().mockImplementation(() => {
    return FRIENDLY_ERROR_MESSAGE;
  });

  return {
    ...actual,
    __esModule: true,
    getUserFriendlyErrorMessage: mockGetUserFriendlyErrorMessage,
  };
});

const mockedGetUserFriendlyErrorMessage = getUserFriendlyErrorMessage as jest.Mock;

// mock the getAPIUrl method
jest.mock("src/envService", () => {
  return {
    ...jest.requireActual("src/envService"),
    getApiUrl: jest.fn().mockReturnValue("https://foo/bar"),
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

  // model license
  const license = "MIT";

  //The locale
  const locale: LocaleAPISpecs.Types.Payload = {
    UUID: "8e763c32-4c21-449c-94ee-7ddeb379369a",
    name: "South Africa",
    shortCode: "ZA",
  };
  // and the UUID history
  const UUIDHistory = [randomUUID()];
  // and the isOriginalESCOModel
  const isOriginalESCOModel = false;
  return { name, description, locale, license, selectedFiles, UUIDHistory, isOriginalESCOModel };
}

describe("ModelDirectory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    ModelInfoService.prototype.fetchAllModelsPeriodically = jest.fn();
    LocalesService.prototype.getLocales = jest.fn();
  });

  afterEach(() => {
    // When using fake timers run the timers so that the timers are cleared before the next test.
    // Currently, there is not a standard way to do check if the fake timers are being used.
    // The following is a hack to check if the fake timers are being used. See https://github.com/jestjs/jest/issues/10555
    // In case we runOnlyPendingTimers() when not using fake timer a jest warning will be shown in the console.
    // @ts-ignore
    if (typeof jest !== "undefined" && setTimeout.clock != null && typeof setTimeout.clock.Date === "function") {
      // if fake timers are being used
      jest.runOnlyPendingTimers();
    }
    jest.useRealTimers();
  });

  describe("ModelDirectory Render", () => {
    describe(
      // eslint-disable-next-line jest/valid-describe-callback,jest/valid-title
      authorizationTests.defaultName,
      authorizationTests.callback({
        name: "ModelDirectory",
        Component: <ModelDirectory />,
        roles: ALL_USERS,
        testIds: [
          MODEL_DIRECTORY_DATA_TEST_ID.MODEL_DIRECTORY_PAGE,
          MODEL_DIRECTORY_HEADER_DATA_TEST_ID.MODEL_DIRECTORY_HEADER,
          MODELS_TABLE_DATA_TEST_ID.MODELS_TABLE_ID,
        ],
      })
    );

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
      expect(ModelDirectoryHeader).toHaveBeenNthCalledWith(
        1,
        { onModelImport: expect.any(Function), isImportModelLoading: false },
        {}
      );

      // AND expect the ModelsTable to be visible
      const modelsTable = screen.getByTestId(MODELS_TABLE_DATA_TEST_ID.MODELS_TABLE_ID);
      expect(modelsTable).toBeInTheDocument();

      // AND the modelPropertiesDrawer is hidden
      expect(ModelPropertiesDrawer).toHaveBeenNthCalledWith(
        1,
        {
          model: null,
          isOpen: false,
          notifyOnClose: expect.any(Function),
        },
        {}
      );

      // AND the ModelsTable should show an empty table with a loading spinner
      expect(ModelsTable).toHaveBeenNthCalledWith(
        1,
        {
          models: [],
          isLoading: true,
          notifyOnExport: expect.any(Function),
          notifyOnShowModelDetails: expect.any(Function),
        },
        {}
      );

      // AND WHEN the ModelInfoService resolves
      await waitFor(() => {
        // THEN expect the ModelInfoService to have been called
        expect(ModelInfoService.prototype.fetchAllModelsPeriodically).toHaveBeenCalled();
      });
      // AND the ModelsTable should re-render with the resolved data and the loading prop should be set to false
      await waitFor(() => {
        expect(ModelsTable).toHaveBeenNthCalledWith(
          2,
          {
            models: givenMockData,
            isLoading: false,
            notifyOnExport: expect.any(Function),
            notifyOnShowModelDetails: expect.any(Function),
          },
          expect.anything()
        );
      });
      // AND expect the ModelDirectory to match the snapshot
      expect(screen.getByTestId(MODEL_DIRECTORY_DATA_TEST_ID.MODEL_DIRECTORY_PAGE)).toMatchSnapshot();
      // AND finally expect no errors or warning to have occurred
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
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
      expect(ModelsTable).toHaveBeenNthCalledWith(
        1,
        {
          models: [],
          isLoading: true,
          notifyOnExport: expect.any(Function),
          notifyOnShowModelDetails: expect.any(Function),
        },
        {}
      );
      // AND the ModelsTable should be rendered succeeds at first
      act(() => {
        jest.advanceTimersToNextTimer();
      });

      await waitFor(() => {
        expect(ModelsTable).toHaveBeenNthCalledWith(
          2,
          {
            models: ["foo1"],
            isLoading: false,
            notifyOnExport: expect.any(Function),
            notifyOnShowModelDetails: expect.any(Function),
          },
          {}
        );
      });
      act(() => {
        jest.advanceTimersToNextTimer();
      });
      await waitFor(() => {
        expect(ModelsTable).toHaveBeenNthCalledWith(
          3,
          {
            models: ["foo2"],
            isLoading: false,
            notifyOnExport: expect.any(Function),
            notifyOnShowModelDetails: expect.any(Function),
          },
          {}
        );
      });
      // AND expect the ModelDirectory to match the snapshot
      expect(screen.getByTestId(MODEL_DIRECTORY_DATA_TEST_ID.MODEL_DIRECTORY_PAGE)).toMatchSnapshot();
      // AND finally expect no errors or warning to have occurred
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
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
      expect(ModelsTable).toHaveBeenNthCalledWith(
        1,
        {
          models: [],
          isLoading: true,
          notifyOnExport: expect.any(Function),
          notifyOnShowModelDetails: expect.any(Function),
        },
        {}
      );

      // AND the ModelsTable should be rendered with the data returned by the ModelInfoService
      act(() => {
        jest.advanceTimersToNextTimer();
      });

      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(1);
      });
      await waitFor(() => {
        expect(ModelsTable).toHaveBeenNthCalledWith(
          2,
          {
            models: ["foo"],
            isLoading: false,
            notifyOnExport: expect.any(Function),
            notifyOnShowModelDetails: expect.any(Function),
          },
          {}
        );
      });

      // AND the ModelsTable should not be re-rendered when the ModelInfoService returns the same data

      //  let the timer run and to fetch the data again
      act(() => {
        jest.advanceTimersToNextTimer();
      });
      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(2);
      });
      //  let the timer run and to fetch the data again
      //  this time new data is returned
      callback.mockImplementationOnce((onSuccess, _) => {
        const givenMockData = ["bar"] as any;
        onSuccess(givenMockData);
      });
      act(() => {
        jest.advanceTimersToNextTimer();
      });
      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(3);
      });
      // now the ModelsTable should be re-rendered with the new data for a total of 3 times ( it was not re-rendered when the same data was returned)
      await waitFor(() => {
        expect(ModelsTable).toHaveBeenNthCalledWith(
          3,
          {
            models: ["bar"],
            isLoading: false,
            notifyOnExport: expect.any(Function),
            notifyOnShowModelDetails: expect.any(Function),
          },
          {}
        );
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
      expect(ModelsTable).toHaveBeenCalledWith(
        {
          models: [],
          isLoading: true,
          notifyOnExport: expect.any(Function),
          notifyOnShowModelDetails: expect.any(Function),
        },
        {}
      );

      // AND WHEN the ModelInfoService fails
      await waitFor(() => {
        // THEN expect getUserFriendlyErrorMessage to have been called with the error
        expect(mockedGetUserFriendlyErrorMessage).toHaveBeenCalledWith(givenError);
      });
      await waitFor(() => {
        // AND expect a snackbar with the error message to be shown
        expect(useSnackbar().enqueueSnackbar).toHaveBeenCalledWith(FRIENDLY_ERROR_MESSAGE, {
          variant: "error",
          key: SNACKBAR_ID.INTERNET_ERROR,
          preventDuplicate: true,
        });
      });
      // AND the ModelsTable props to remain the same
      expect(ModelsTable).toHaveBeenCalledWith(
        {
          models: [],
          isLoading: true,
          notifyOnExport: expect.any(Function),
          notifyOnShowModelDetails: expect.any(Function),
        },
        {}
      );
      // AND the ModelsTable should not be re-rendered
      expect(ModelsTable).toHaveBeenCalledTimes(1);
      // AND finally expect no warning to have occurred
      expect(console.warn).not.toHaveBeenCalled();
    });

    test("should show the table with the previous data and the error message when data fetching fails after it has succeed once", async () => {
      // GIVEN the model info service will succeed and return some data then fails with some error at the second call
      jest.useFakeTimers();
      const givenMockData = ["foo"] as any;
      const callback = jest.fn();
      const givenError = new Error("foo");
      callback
        .mockImplementationOnce((onSuccess, _) => {
          onSuccess(givenMockData);
        })
        .mockImplementationOnce((_, onError) => {
          onError(givenError);
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
      expect(ModelsTable).toHaveBeenNthCalledWith(
        1,
        {
          models: [],
          isLoading: true,
          notifyOnExport: expect.any(Function),
          notifyOnShowModelDetails: expect.any(Function),
        },
        {}
      );
      // AND WHEN the ModelInfoService succeeds at first
      act(() => {
        jest.advanceTimersToNextTimer();
      });

      await waitFor(() => {
        // THEN expect the ModelsTable to have been called with the correct props
        expect(ModelsTable).toHaveBeenNthCalledWith(
          2,
          {
            models: givenMockData,
            isLoading: false,
            notifyOnExport: expect.any(Function),
            notifyOnShowModelDetails: expect.any(Function),
          },
          expect.anything()
        );
      });
      // AND WHEN the ModelInfoService fails
      act(() => {
        jest.advanceTimersToNextTimer();
      });
      // AND WHEN the ModelInfoService fails
      await waitFor(() => {
        // THEN expect getUserFriendlyErrorMessage to have been called with the error
        expect(mockedGetUserFriendlyErrorMessage).toHaveBeenCalledWith(givenError);
      });
      await waitFor(() => {
        // THEN expect a snackbar with the error message to be shown
        expect(useSnackbar().enqueueSnackbar).toHaveBeenCalledWith(FRIENDLY_ERROR_MESSAGE, {
          variant: "error",
          key: SNACKBAR_ID.INTERNET_ERROR,
          preventDuplicate: true,
        });
      });
      // AND the ModelsTable to have been called with the previous props
      expect(ModelsTable).toHaveBeenLastCalledWith(
        {
          models: givenMockData,
          isLoading: false,
          notifyOnExport: expect.any(Function),
          notifyOnShowModelDetails: expect.any(Function),
        },
        {}
      );
      // AND finally expect no warning to have occurred
      expect(console.warn).not.toHaveBeenCalled();
    });

    test("should remove error snackbar when fetch model succeeds after it has failed", async () => {
      // GIVEN the model info service will fails with some error two times then succeed at the third call
      jest.useFakeTimers();
      const givenMockData = ["foo"] as any;
      const callback = jest.fn();
      const givenError = new Error("foo");
      callback
        .mockImplementationOnce((_, onError) => {
          onError(givenError);
        })
        .mockImplementationOnce((onSuccess, _) => {
          onSuccess(givenMockData);
        });
      jest.spyOn(ModelInfoService.prototype, "fetchAllModelsPeriodically").mockImplementationOnce((onSuccess, _) => {
        return setInterval(() => callback(onSuccess, _), 1000);
      });

      // WHEN the ModelDirectory is mounted
      render(<ModelDirectory />);

      // AND WHEN the ModelInfoService fails at first
      act(() => {
        jest.advanceTimersToNextTimer();
      });

      await waitFor(() => {
        // THEN expect getUserFriendlyErrorMessage to have been called with the error
        expect(mockedGetUserFriendlyErrorMessage).toHaveBeenCalledWith(givenError);
      });
      await waitFor(() => {
        // AND expect a snackbar with the error message to be shown
        expect(useSnackbar().enqueueSnackbar).toHaveBeenCalledWith(FRIENDLY_ERROR_MESSAGE, {
          variant: "error",
          key: SNACKBAR_ID.INTERNET_ERROR,
          preventDuplicate: true,
        });
      });

      // AND WHEN the ModelInfoService succeeds
      act(() => {
        jest.advanceTimersToNextTimer();
      });

      await waitFor(() => {
        // THEN expect a snackbar with the error message to be closed
        expect(useSnackbar().closeSnackbar).toHaveBeenCalledWith(SNACKBAR_ID.INTERNET_ERROR);
      });
      // AND finally expect no warning to have occurred
      expect(console.warn).not.toHaveBeenCalled();
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
      const { unmount } = render(<ModelDirectory />);

      // THEN expect no errors or warning to have occurred
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      // AND  expect the ModelDirectory to be visible
      const actualModelDirectory = screen.getByTestId(MODEL_DIRECTORY_DATA_TEST_ID.MODEL_DIRECTORY_PAGE);
      expect(actualModelDirectory).toBeInTheDocument();
      // AND expect the model info service to have been called twice (once when the component is mounted and once when the timer fires)
      act(() => {
        jest.advanceTimersToNextTimer();
      });
      await waitFor(() => {
        expect(fetchAllModelsPeriodicallySpy).toHaveBeenCalledTimes(2);
      });
      expect(timerIds.length).toBe(2);

      // AND WHEN the model info service is called for the third time
      act(() => {
        jest.advanceTimersToNextTimer();
      });
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

      // AND finally expect no errors or warning to have occurred
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
    });

    test("should throw a ServiceError when the model info service fails", async () => {
      // GIVEN the model info service will fail with some error
      const mockServiceError = new ServiceError(
        "ServiceName",
        "ServiceFunction",
        "GET",
        "/api/path",
        500,
        ErrorCodes.API_ERROR,
        "Service Error Message"
      );
      jest.spyOn(ModelInfoService.prototype, "fetchAllModelsPeriodically").mockImplementation((_, onError) => {
        onError(mockServiceError);
        return 1 as unknown as NodeJS.Timer;
      });

      // WHEN the ModelDirectory is mounted
      render(<ModelDirectory />);
      // AND the ModelInfoService fails

      // THEN expect a snackbar with the error message to be shown
      await waitFor(() => {
        expect(useSnackbar().enqueueSnackbar).toHaveBeenCalledWith(FRIENDLY_ERROR_MESSAGE, {
          variant: "error",
          key: SNACKBAR_ID.INTERNET_ERROR,
          preventDuplicate: true,
        });
      });
      // AND writeServiceErrorToLog to have been called
      expect(writeServiceErrorToLog).toHaveBeenCalledWith(mockServiceError, console.error);
    });

    describe("Internet status", () => {
      afterAll(() => {
        unmockBrowserIsOnLine();
      });

      test("should fetch data when the internet switches from offline to online", async () => {
        jest.useFakeTimers();
        // Testing the following scenario:
        //  (A) online -> render (fetch/Timer Clear) ->
        //  (B) offline (Timer Clear/No Fetch) ->
        //  (C) online (No Timer Clear/Fetch) ->
        //  (D) offline (Timer Clear/No Fetch)"

        // GIVEN the model info service is called periodically, and it will return empty data each time
        // to avoid causing a new timer to be created each time (see the comments in the implementation in ModelDirectory.tsx)
        // This way the tests will be simpler

        const callback = jest.fn();
        callback.mockImplementation((onSuccess, _) => {
          onSuccess([]);
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
        // ----------------------------------------------
        // (A) "online -> render expect(fetch/Timer Clear)
        // ----------------------------------------------
        // AND the internet is initially online
        mockBrowserIsOnLine(true);

        // WHEN the model directory is rendered
        render(<ModelDirectory />);

        // THEN expect the fetchAllModelsPeriodically to have been called
        expect(fetchAllModelsPeriodicallySpy).toHaveBeenCalled();

        // ----------------------------------------------
        // (B) offline expect(Timer Clear/No Fetch)
        // ----------------------------------------------

        // AND WHEN the internet goes offline
        act(() => mockBrowserIsOnLine(false));

        // THEN expect the timer from the previous fetch to have been cleared
        await waitFor(() => {
          expect(clearIntervalSpy).toHaveBeenNthCalledWith(1, timerIds[0]);
        });
        // AND if the time has progressed
        act(() => {
          jest.advanceTimersToNextTimer();
        });
        // THEN expect the fetchAllModelsPeriodically to not have been called
        expect(fetchAllModelsPeriodicallySpy).toHaveBeenCalledTimes(1);

        // ----------------------------------------------
        // (C) online expect(No Timer Clear/ Fetch)
        // ----------------------------------------------

        // AND WHEN the internet goes online
        act(() => mockBrowserIsOnLine(true));

        // THEN expect that there was not timer to clear
        await waitFor(() => {
          expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
        });
        // AND if the time has progressed
        act(() => {
          jest.advanceTimersToNextTimer();
        });
        // THEN expect the fetchAllModelsPeriodically to have been called
        expect(fetchAllModelsPeriodicallySpy).toHaveBeenCalledTimes(2);

        // ----------------------------------------------
        // (D) offline expect(Timer Clear/No Fetch)
        // ----------------------------------------------

        // AND WHEN the internet goes offline
        act(() => mockBrowserIsOnLine(false));

        // THEN expect the timer from the previous fetch to have been cleared
        await waitFor(() => {
          expect(clearIntervalSpy).toHaveBeenNthCalledWith(2, timerIds[1]);
        });
        // AND if the time has progressed
        act(() => {
          jest.advanceTimersToNextTimer();
        });
        // THEN expect the fetchAllModelsPeriodically to not have been called
        expect(fetchAllModelsPeriodicallySpy).toHaveBeenCalledTimes(2);

        // at the end of the test, the clearInterval spy otherwise the following tests will fail with the error
        //  clearInterval is not defined
        //  ReferenceError: clearInterval is not defined
        clearIntervalSpy.mockRestore();
      });

      test("when rendered is should not fetch data if the internet is offline", async () => {
        jest.useFakeTimers();
        // GIVEN the model info service is called periodically, and it will return empty data each time
        // to avoid causing a new timer to be created each time (see the comments in the implementation in ModelDirectory.tsx)
        const callback = jest.fn();
        callback.mockImplementation((onSuccess, _) => {
          onSuccess([]);
        });

        jest.spyOn(ModelInfoService.prototype, "fetchAllModelsPeriodically").mockImplementation((onSuccess, _) => {
          return setInterval(() => callback(onSuccess, _), 1000);
        });

        // GIVEN that the internet will be offline

        mockBrowserIsOnLine(false);

        // WHEN the model directory is rendered
        render(<ModelDirectory />);

        // THEN expect the fetchAllModelsPeriodically to not have been called
        expect(ModelInfoService.prototype.fetchAllModelsPeriodically).not.toHaveBeenCalled();
        // AND the table is rendered with the isLoading state
        expect(ModelsTable).toHaveBeenNthCalledWith(
          1,
          {
            models: [],
            isLoading: true,
            notifyOnExport: expect.any(Function),
            notifyOnShowModelDetails: expect.any(Function),
          },
          {}
        );

        // AND WHEN the internet goes online
        act(() => mockBrowserIsOnLine(true));
        // THEN expect the fetchAllModelsPeriodically to have been called
        expect(ModelInfoService.prototype.fetchAllModelsPeriodically).toHaveBeenCalled();

        // AND WHEN the time has progressed and the fetchAllModelsPeriodically resolves
        act(() => {
          jest.advanceTimersToNextTimer(); // so that the promise from the fetchAllModelsPeriodically resolves
        });

        // THEN the table is not rendered in the isLoading state
        //  The model is rendered three times, because offline/online notification causes it to re-render
        //  so simply checking the last call here would do the job
        expect(ModelsTable).toHaveBeenLastCalledWith(
          {
            models: [],
            isLoading: false,
            notifyOnExport: expect.any(Function),
            notifyOnShowModelDetails: expect.any(Function),
          },
          {}
        );

        // AND no error or warning to have occurred
        expect(console.error).not.toHaveBeenCalled();
        expect(console.warn).not.toHaveBeenCalled();
      });
    });
  });

  describe("ModelDirectory.ImportDialog action tests", () => {
    test("should show ImportDialog when import button is clicked", async () => {
      // GIVEN the ModelDirectory is rendered
      const givenLocales = getArrayOfFakeLocales(4);
      jest.spyOn(LocalesService.prototype, "getLocales").mockResolvedValue(givenLocales);
      render(<ModelDirectory />);

      // WHEN the user click the import button
      act(() => {
        (ModelDirectoryHeader as jest.Mock).mock.lastCall[0].onModelImport();
      });

      // THEN expect the ImportDialog to be visible
      const importDialog = await screen.findByTestId(IMPORT_DIALOG_DATA_TEST_ID.IMPORT_MODEL_DIALOG);
      expect(importDialog).toBeVisible();

      // AND expect the import dialog to have been called with the correct props
      expect(ImportModelDialog).toHaveBeenCalledWith(
        expect.objectContaining({
          availableLocales: givenLocales,
          notifyOnClose: expect.any(Function),
        }),
        {}
      );
    });

    test("should close ImportDialog and not import the model when cancel button is clicked", async () => {
      // GIVEN the ModelDirectory is rendered
      render(<ModelDirectory />);

      // AND the user clicks the import button
      act(() => {
        (ModelDirectoryHeader as jest.Mock).mock.lastCall[0].onModelImport();
      });

      // AND the ImportDialog is shown
      const importDialog = await screen.findByTestId(IMPORT_DIALOG_DATA_TEST_ID.IMPORT_MODEL_DIALOG);
      expect(importDialog).toBeVisible();

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
      const importDialog = await screen.findByTestId(IMPORT_DIALOG_DATA_TEST_ID.IMPORT_MODEL_DIALOG);
      expect(importDialog).toBeVisible();

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
      expect(Backdrop).toHaveBeenNthCalledWith(
        1,
        {
          isShown: true,
          message: "The model is being created and the files uploaded. Please wait ... ",
        },
        {}
      );

      // AND expect the import director service to have been called with the data entered by the user
      expect(ImportDirectorService.prototype.directImport).toHaveBeenCalledWith(
        givenImportData.name,
        givenImportData.description,
        givenImportData.license,
        givenImportData.locale,
        givenImportData.selectedFiles,
        givenImportData.UUIDHistory,
        givenImportData.isOriginalESCOModel
      );

      // AND expect the ModelsTable to have been called with the new model
      const modelsTable = screen.getByTestId(MODELS_TABLE_DATA_TEST_ID.MODELS_TABLE_ID);
      expect(modelsTable).toBeInTheDocument();
      await waitFor(() => {
        expect(ModelsTable).toHaveBeenCalledWith(
          {
            models: expect.arrayContaining([givenNewModel]),
            isLoading: expect.any(Boolean),
            notifyOnExport: expect.any(Function),
            notifyOnShowModelDetails: expect.any(Function),
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
      const importDialog = await screen.findByTestId(IMPORT_DIALOG_DATA_TEST_ID.IMPORT_MODEL_DIALOG);
      expect(importDialog).toBeVisible();

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
      expect(Backdrop).toHaveBeenNthCalledWith(
        1,
        {
          isShown: true,
          message: "The model is being created and the files uploaded. Please wait ... ",
        },
        {}
      );

      // AND expect the import director service to have been called with the data entered by the user
      expect(ImportDirectorService.prototype.directImport).toHaveBeenCalledWith(
        givenImportData.name,
        givenImportData.description,
        givenImportData.license,
        givenImportData.locale,
        givenImportData.selectedFiles,
        givenImportData.UUIDHistory,
        givenImportData.isOriginalESCOModel
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

    test("should throw a ServiceError when import director fails to import", async () => {
      // GIVEN the ModelDirectory is rendered
      render(<ModelDirectory />);
      // AND the import will fail
      const mockServiceError = new ServiceError(
        "ServiceName",
        "ServiceFunction",
        "POST",
        "/api/path",
        500,
        ErrorCodes.API_ERROR,
        "Service Error Message"
      );

      ImportDirectorService.prototype.directImport = jest
        .fn()
        .mockImplementation(() => Promise.reject(mockServiceError));

      // WHEN the user clicks the import button
      act(() => {
        (ModelDirectoryHeader as jest.Mock).mock.lastCall[0].onModelImport();
      });

      // AND the ImportDialog is shown
      const importDialog = await screen.findByTestId(IMPORT_DIALOG_DATA_TEST_ID.IMPORT_MODEL_DIALOG);
      expect(importDialog).toBeVisible();

      // AND the user has entered all the data required for the import
      const givenImportData = getTestImportData();

      // AND the triggers an import
      act(() => {
        const mock = (ImportModelDialog as jest.Mock).mock;
        mock.lastCall[0].notifyOnClose({
          name: "IMPORT",
          importData: givenImportData,
        });
      });

      // THEN expect the import director service to have been called with the data entered by the user
      expect(ImportDirectorService.prototype.directImport).toHaveBeenCalledWith(
        givenImportData.name,
        givenImportData.description,
        givenImportData.license,
        givenImportData.locale,
        givenImportData.selectedFiles,
        givenImportData.UUIDHistory,
        givenImportData.isOriginalESCOModel
      );

      // AND the backdrop will eventually be hidden
      await waitFor(() => {
        const backdrop = screen.queryByTestId(BACKDROP_DATA_TEST_ID.BACKDROP_CONTAINER);
        expect(backdrop).not.toBeInTheDocument();
      });

      // AND the snackbar notification was shown
      expect(useSnackbar().enqueueSnackbar).toHaveBeenCalledWith(
        `The model '${givenImportData.name}' import could not be started. Please try again.`,
        { variant: "error" }
      );

      // AND writeServiceErrorToLog to have been called
      expect(writeServiceErrorToLog).toHaveBeenCalledWith(mockServiceError, console.error);
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
      const importDialog = await screen.findByTestId(IMPORT_DIALOG_DATA_TEST_ID.IMPORT_MODEL_DIALOG);
      expect(importDialog).toBeVisible();

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
            notifyOnExport: expect.any(Function),
            notifyOnShowModelDetails: expect.any(Function),
          },
          expect.anything()
        );
      });
    });

    test("should throw a ServiceError when the locales service fails", async () => {
      // GIVEN the ModelDirectory is rendered
      render(<ModelDirectory />);
      const mockServiceError = new ServiceError(
        "ServiceName",
        "ServiceFunction",
        "GET",
        "/api/path",
        500,
        ErrorCodes.API_ERROR,
        "Service Error Message"
      );
      LocalesService.prototype.getLocales = jest.fn().mockRejectedValueOnce(mockServiceError);

      // WHEN the user clicks the import button
      act(() => {
        (ModelDirectoryHeader as jest.Mock).mock.lastCall[0].onModelImport();
      });

      // THEN expect the ImportDialog to not be visible
      const importDialog = screen.queryByTestId(IMPORT_DIALOG_DATA_TEST_ID.IMPORT_MODEL_DIALOG);
      expect(importDialog).toBeNull();
      // AND writeServiceErrorToLog to have been called
      await waitFor(() => {
        expect(writeServiceErrorToLog).toHaveBeenCalledWith(mockServiceError, console.error);
      });
    });

    test("should throw an error when the locales service fails", async () => {
      // GIVEN the ModelDirectory is rendered
      render(<ModelDirectory />);
      // AND the locales service will fail
      const mockError = new Error("Locales service failed");
      LocalesService.prototype.getLocales = jest.fn().mockRejectedValueOnce(mockError);

      // WHEN the user clicks the import button
      act(() => {
        (ModelDirectoryHeader as jest.Mock).mock.lastCall[0].onModelImport();
      });

      // THEN expect the ImportDialog to not be visible
      const importDialog = screen.queryByTestId(IMPORT_DIALOG_DATA_TEST_ID.IMPORT_MODEL_DIALOG);
      expect(importDialog).toBeNull();
      // AND the error to be thrown
      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(mockError);
      });
    });
  });

  describe("ModelTable action tests: handleNotifyOnExport", () => {
    test("should handle export successfully", async () => {
      // GIVEN the ModelDirectory is rendered
      const givenModels = getArrayOfRandomModelsMaxLength(3);
      jest.spyOn(ModelInfoService.prototype, "fetchAllModelsPeriodically").mockImplementation((onSuccess, _) => {
        onSuccess(givenModels);
        return 1 as unknown as NodeJS.Timer;
      });
      render(<ModelDirectory />);
      // AND the export will succeed
      const givenExportedModel = givenModels[1];
      ExportService.prototype.exportModel = jest.fn().mockResolvedValueOnce(givenExportedModel);

      // WHEN the user clicks the export button
      act(() => {
        const mock = (ModelsTable as jest.Mock).mock;
        mock.lastCall[0].notifyOnExport(givenExportedModel.id);
      });

      // THEN expect the backdrop to be shown
      expect(Backdrop).toHaveBeenNthCalledWith(
        1,
        {
          isShown: true,
          message: "The model is being exported. Please wait ...",
        },
        {}
      );
      // AND the exportModel service to have been called with the modelId
      expect(ExportService.prototype.exportModel).toHaveBeenCalledWith(givenExportedModel.id);
      // AND the snackbar notification to be shown
      await waitFor(() => {
        expect(useSnackbar().enqueueSnackbar).toHaveBeenCalledWith(
          `The model '${givenExportedModel.name}' export has started.`,
          {
            variant: "success",
            preventDuplicate: true,
          }
        );
      });
    });

    test("should handle export failure", async () => {
      // GIVEN the ModelDirectory is rendered
      const givenModels = getArrayOfRandomModelsMaxLength(3);
      jest.spyOn(ModelInfoService.prototype, "fetchAllModelsPeriodically").mockImplementation((onSuccess, _) => {
        onSuccess(givenModels);
        return 1 as unknown as NodeJS.Timer;
      });
      render(<ModelDirectory />);
      // AND the export will fail
      const givenExportedModel = givenModels[1];
      ExportService.prototype.exportModel = jest.fn().mockRejectedValueOnce(new Error("Export failed"));

      // WHEN the user clicks the export button
      act(() => {
        const mock = (ModelsTable as jest.Mock).mock;
        mock.lastCall[0].notifyOnExport(givenExportedModel.id);
      });

      // THEN expect the backdrop to be shown
      expect(Backdrop).toHaveBeenNthCalledWith(
        1,
        {
          isShown: true,
          message: "The model is being exported. Please wait ...",
        },
        {}
      );
      // AND the exportModel service to have been called with the modelId
      expect(ExportService.prototype.exportModel).toHaveBeenCalledWith(givenExportedModel.id);
      // AND the snackbar notification to be shown
      await waitFor(() => {
        expect(useSnackbar().enqueueSnackbar).toHaveBeenCalledWith(
          `The model '${givenExportedModel.name}' export could not be started. Please try again.`,
          {
            variant: "error",
            preventDuplicate: true,
          }
        );
      });
    });

    test("should throw a ServiceError when export service fails to export", async () => {
      // GIVEN the ModelDirectory is rendered
      const givenModels = getArrayOfRandomModelsMaxLength(3);
      jest.spyOn(ModelInfoService.prototype, "fetchAllModelsPeriodically").mockImplementation((onSuccess, _) => {
        onSuccess(givenModels);
        return 1 as unknown as NodeJS.Timer;
      });
      render(<ModelDirectory />);
      // AND the export will fail
      const givenExportedModel = givenModels[1];
      const mockServiceError = new ServiceError(
        "ServiceName",
        "ServiceFunction",
        "POST",
        "/api/path",
        500,
        ErrorCodes.API_ERROR,
        "Service Error Message"
      );
      ExportService.prototype.exportModel = jest.fn().mockRejectedValueOnce(mockServiceError);

      // WHEN the user clicks the export button
      act(() => {
        const mock = (ModelsTable as jest.Mock).mock;
        mock.lastCall[0].notifyOnExport(givenExportedModel.id);
      });

      // THEN expect the exportModel service to have been called with the modelId
      expect(ExportService.prototype.exportModel).toHaveBeenCalledWith(givenExportedModel.id);
      // AND the snackbar notification to be shown
      await waitFor(() => {
        expect(useSnackbar().enqueueSnackbar).toHaveBeenCalledWith(
          `The model '${givenExportedModel.name}' export could not be started. Please try again.`,
          {
            variant: "error",
            preventDuplicate: true,
          }
        );
      });
      // AND writeServiceErrorToLog to have been called
      expect(writeServiceErrorToLog).toHaveBeenCalledWith(mockServiceError, console.error);
    });
  });

  describe("ModelTable action tests handleNotifyOnShowModelDetails", () => {
    test("should show modelPropertiesDrawer successfully and then hide it", async () => {
      // GIVEN the ModelDirectory is rendered
      const givenModels = getArrayOfRandomModelsMaxLength(3);
      jest.spyOn(ModelInfoService.prototype, "fetchAllModelsPeriodically").mockImplementation((onSuccess, _) => {
        onSuccess(givenModels);
        return 1 as unknown as NodeJS.Timer;
      });
      render(<ModelDirectory />);

      // WHEN the user clicks the show details button of some model
      const givenSelectedModel = givenModels[1];
      act(() => {
        const mock = (ModelsTable as jest.Mock).mock;
        mock.lastCall[0].notifyOnShowModelDetails(givenSelectedModel.id);
      });

      // THEN expect the drawer to be shown with the properties of the selected model
      expect(ModelPropertiesDrawer).toHaveBeenLastCalledWith(
        {
          model: givenSelectedModel,
          isOpen: true,
          notifyOnClose: expect.any(Function),
        },
        {}
      );

      // AND WHEN the user dismisses the drawer
      act(() => {
        const mock = (ModelPropertiesDrawer as jest.Mock).mock;
        mock.lastCall[0].notifyOnClose();
      });

      // THEN expect the drawer to be hidden with the properties of the selected model so that while it transitions it
      // will still show the last props
      expect(ModelPropertiesDrawer).toHaveBeenLastCalledWith(
        {
          model: givenSelectedModel,
          isOpen: false,
          notifyOnClose: expect.any(Function),
        },
        {}
      );
    });

    test("should show a snack bar when the model is not found", async () => {
      // GIVEN the ModelDirectory is rendered
      const givenModels = getArrayOfRandomModelsMaxLength(3);
      jest.spyOn(ModelInfoService.prototype, "fetchAllModelsPeriodically").mockImplementation((onSuccess, _) => {
        onSuccess(givenModels);
        return 1 as unknown as NodeJS.Timer;
      });
      render(<ModelDirectory />);

      // WHEN the user clicks the show details button of some model
      const givenSelectedModel = "non-existing-id";
      act(() => {
        const mock = (ModelsTable as jest.Mock).mock;
        mock.lastCall[0].notifyOnShowModelDetails(givenSelectedModel);
      });

      // THEN expect the snackbar to be shown
      await waitFor(() => {
        expect(useSnackbar().enqueueSnackbar).toHaveBeenCalledWith(
          `The selected model could not be found. Please try again. If the problem persists, clear your browser's cache and refresh the page.`,
          {
            variant: "error",
            preventDuplicate: true,
          }
        );
      });
    });
  });
});
