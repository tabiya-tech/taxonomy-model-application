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
import ModelsCardList, {
  DATA_TEST_ID as MODELS_CARD_LIST_DATA_TEST_ID,
} from "./components/ModelsCardList/ModelsCardList";
import ModelDirectoryHeader, {
  DATA_TEST_ID as MODEL_DIRECTORY_HEADER_DATA_TEST_ID,
} from "./components/ModelDirectoryHeader/ModelDirectoryHeader";
import ModelInfoService, { UPDATE_INTERVAL } from "src/modelInfo/modelInfo.service";
import ExportService from "src/export/export.service";
import LocalesService from "src/locale/locales.service";
import ImportAPISpecs from "api-specifications/import";

import {
  getArrayOfRandomModelsMaxLength,
  getOneRandomModelMaxLength,
  getOneDeterministicFakeModel,
} from "./_test_utilities/mockModelData";
import { getArrayOfFakeLocales } from "src/locale/_test_utilities/mockLocales";
import { IMPORT_PROCESS_STATUS, LocaleSchema } from "src/api-types";
import { mockBrowserIsOnLine, unmockBrowserIsOnLine } from "src/_test_utilities/mockBrowserIsOnline";

import { getUserFriendlyErrorMessage, ServiceError } from "src/error/error";
import { writeServiceErrorToLog } from "src/error/logger";
import { ErrorCodes } from "src/error/errorCodes";
import ModelPropertiesDrawer from "./components/ModelProperties/ModelPropertiesDrawer";
import { randomUUID } from "crypto";

import { ALL_USERS, authorizationTests } from "src/_test_utilities/authorizationTests";

// mock the model info service, as we do not want the real service to be called during testing
jest.mock("src/modelInfo/modelInfo.service", () => {
  const actual = jest.requireActual("src/modelInfo/modelInfo.service");
  // Mocking the ES5 class
  const mockModelInfoService = jest.fn(); // the constructor
  mockModelInfoService.prototype.createModel = jest.fn(); // adding a mock method
  mockModelInfoService.prototype.getAllModels = jest.fn(); // adding a mock method
  mockModelInfoService.prototype.releaseModel = jest.fn(); // adding a mock method
  return {
    __esModule: true,
    default: mockModelInfoService,
    UPDATE_INTERVAL: actual.UPDATE_INTERVAL,
  };
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

// mock framer-motion so ContentLayout's fade-in animation renders in its final state immediately,
// keeping the snapshot deterministic instead of capturing whatever opacity the animation is mid-way through
jest.mock("framer-motion", () => ({
  motion: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    div: ({ initial, animate, exit, transition, children, ...domProps }: any) => <div {...domProps}>{children}</div>,
  },
}));

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

// mock the ModelsCardList
jest.mock("src/modeldirectory/components/ModelsCardList/ModelsCardList", () => {
  const actual = jest.requireActual("src/modeldirectory/components/ModelsCardList/ModelsCardList");
  const mockModelsCardList = jest.fn().mockImplementation(() => {
    return <div data-testid={actual.DATA_TEST_ID.MODELS_CARD_LIST}> My Models Card List</div>;
  });

  return {
    ...actual,
    __esModule: true,
    default: mockModelsCardList,
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

// mock useNavigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Drains the microtask queue enough times for TanStack Query's internal promise chain
// (queryFn -> retryer -> observer notify) to settle after advancing fake timers.
async function flushPromises() {
  for (let i = 0; i < 10; i++) {
    await Promise.resolve();
  }
}

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
  const locale: LocaleSchema = {
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
    ModelInfoService.prototype.getAllModels = jest.fn().mockResolvedValue([]);
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
          MODELS_CARD_LIST_DATA_TEST_ID.MODELS_CARD_LIST,
        ],
      })
    );

    test("ModelDirectory initial render tests", async () => {
      // GIVEN the model info service will resolve with some data
      // (deterministic fixture data, since this test asserts a snapshot)
      const givenMockData = [getOneDeterministicFakeModel(1)];
      jest.spyOn(ModelInfoService.prototype, "getAllModels").mockResolvedValue(givenMockData);

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

      // AND expect the ModelsCardList to be visible
      const modelsCardList = screen.getByTestId(MODELS_CARD_LIST_DATA_TEST_ID.MODELS_CARD_LIST);
      expect(modelsCardList).toBeInTheDocument();

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

      // AND the ModelsCardList should show an empty table with a loading spinner
      expect(ModelsCardList).toHaveBeenNthCalledWith(
        1,
        {
          models: [],
          isLoading: true,
          notifyOnExport: expect.any(Function),
          notifyOnExplore: expect.any(Function),
          notifyOnShowModelDetails: expect.any(Function),
          notifyOnRelease: expect.any(Function),
        },
        {}
      );

      // AND WHEN the ModelInfoService resolves
      await waitFor(() => {
        // THEN expect the ModelInfoService to have been called
        expect(ModelInfoService.prototype.getAllModels).toHaveBeenCalled();
      });
      // AND the ModelsCardList should re-render with the resolved data and the loading prop should be set to false
      await waitFor(() => {
        expect(ModelsCardList).toHaveBeenLastCalledWith(
          {
            models: givenMockData,
            isLoading: false,
            notifyOnExport: expect.any(Function),
            notifyOnExplore: expect.any(Function),
            notifyOnShowModelDetails: expect.any(Function),
            notifyOnRelease: expect.any(Function),
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

    test("should keep polling every UPDATE_INTERVAL while a model has an active import or export process", async () => {
      jest.useFakeTimers();
      // GIVEN a model with an import currently running
      const givenRunningModel = getOneRandomModelMaxLength();
      givenRunningModel.importProcessState = {
        ...givenRunningModel.importProcessState,
        status: IMPORT_PROCESS_STATUS.RUNNING,
      };
      const getAllModelsSpy = jest
        .spyOn(ModelInfoService.prototype, "getAllModels")
        .mockResolvedValue([givenRunningModel]);

      // WHEN the ModelDirectory is mounted
      render(<ModelDirectory />);

      // THEN expect the initial fetch to have happened
      await act(async () => {
        await flushPromises();
      });
      expect(getAllModelsSpy).toHaveBeenCalledTimes(1);

      // AND WHEN UPDATE_INTERVAL elapses
      await act(async () => {
        jest.advanceTimersByTime(UPDATE_INTERVAL);
        await flushPromises();
      });
      // THEN expect another fetch to have been triggered, because a process is still active
      expect(getAllModelsSpy).toHaveBeenCalledTimes(2);

      // AND WHEN UPDATE_INTERVAL elapses again
      await act(async () => {
        jest.advanceTimersByTime(UPDATE_INTERVAL);
        await flushPromises();
      });
      // THEN expect a third fetch to have been triggered
      expect(getAllModelsSpy).toHaveBeenCalledTimes(3);
      // AND finally expect no errors or warning to have occurred
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
    });

    test("should stop polling once no model has an active import or export process", async () => {
      jest.useFakeTimers();
      // GIVEN a model with an import currently running and no active exports
      const givenRunningModel = getOneRandomModelMaxLength();
      givenRunningModel.importProcessState = {
        ...givenRunningModel.importProcessState,
        status: IMPORT_PROCESS_STATUS.RUNNING,
      };
      givenRunningModel.exportProcessState = [];
      const givenCompletedModel = {
        ...givenRunningModel,
        importProcessState: {
          ...givenRunningModel.importProcessState,
          status: IMPORT_PROCESS_STATUS.COMPLETED,
        },
      };
      const getAllModelsSpy = jest
        .spyOn(ModelInfoService.prototype, "getAllModels")
        .mockResolvedValueOnce([givenRunningModel])
        .mockResolvedValue([givenCompletedModel]);

      // WHEN the ModelDirectory is mounted
      render(<ModelDirectory />);

      // THEN expect the initial fetch to have happened
      await act(async () => {
        await flushPromises();
      });
      expect(getAllModelsSpy).toHaveBeenCalledTimes(1);

      // AND WHEN UPDATE_INTERVAL elapses, the import has since completed
      await act(async () => {
        jest.advanceTimersByTime(UPDATE_INTERVAL);
        await flushPromises();
      });
      expect(getAllModelsSpy).toHaveBeenCalledTimes(2);
      expect(ModelsCardList).toHaveBeenLastCalledWith(
        {
          models: [givenCompletedModel],
          isLoading: false,
          notifyOnExport: expect.any(Function),
          notifyOnExplore: expect.any(Function),
          notifyOnShowModelDetails: expect.any(Function),
          notifyOnRelease: expect.any(Function),
        },
        expect.anything()
      );

      // AND WHEN more time passes, one UPDATE_INTERVAL at a time
      for (let i = 0; i < 3; i++) {
        await act(async () => {
          jest.advanceTimersByTime(UPDATE_INTERVAL);
          await flushPromises();
        });
      }
      // THEN expect no further fetch to have been triggered, because no process remains active
      expect(getAllModelsSpy).toHaveBeenCalledTimes(2);
    });

    test("should show the error message when data fetching fails while the card list is loading for the first time", async () => {
      // GIVEN the model info service will fail with some error
      const givenError = new Error("foo");
      jest.spyOn(ModelInfoService.prototype, "getAllModels").mockRejectedValue(givenError);

      // WHEN the ModelDirectory is mounted
      render(<ModelDirectory />);

      // AND  expect the ModelsCardList to be visible
      const modelsCardList = screen.getByTestId(MODELS_CARD_LIST_DATA_TEST_ID.MODELS_CARD_LIST);
      expect(modelsCardList).toBeInTheDocument();
      // AND the ModelsCardList should receive the correct default props.
      expect(ModelsCardList).toHaveBeenNthCalledWith(
        1,
        {
          models: [],
          isLoading: true,
          notifyOnExport: expect.any(Function),
          notifyOnExplore: expect.any(Function),
          notifyOnShowModelDetails: expect.any(Function),
          notifyOnRelease: expect.any(Function),
        },
        {}
      );

      // AND WHEN the ModelInfoService fails
      // (query retries a few times with backoff before settling into the error state)
      await waitFor(
        () => {
          // THEN expect getUserFriendlyErrorMessage to have been called with the error
          expect(mockedGetUserFriendlyErrorMessage).toHaveBeenCalledWith(givenError);
        },
        { timeout: 10000 }
      );
      await waitFor(() => {
        // AND expect a snackbar with the error message to be shown
        expect(useSnackbar().enqueueSnackbar).toHaveBeenCalledWith(FRIENDLY_ERROR_MESSAGE, {
          variant: "error",
          key: SNACKBAR_ID.INTERNET_ERROR,
          preventDuplicate: true,
        });
      });
      // AND the ModelsCardList to still show no models, since none were ever fetched successfully
      expect(ModelsCardList).toHaveBeenLastCalledWith(
        {
          models: [],
          isLoading: false,
          notifyOnExport: expect.any(Function),
          notifyOnExplore: expect.any(Function),
          notifyOnShowModelDetails: expect.any(Function),
          notifyOnRelease: expect.any(Function),
        },
        expect.anything()
      );
      // AND finally expect no warning to have occurred
      expect(console.warn).not.toHaveBeenCalled();
    }, 15000);

    test("should show the card list with the previous data and the error message when data fetching fails after it has succeed once", async () => {
      // GIVEN the model info service will succeed and return some data, and a process is still active so it keeps polling
      const givenRunningModel = getOneRandomModelMaxLength();
      givenRunningModel.importProcessState = {
        ...givenRunningModel.importProcessState,
        status: IMPORT_PROCESS_STATUS.RUNNING,
      };
      const givenMockData = [givenRunningModel];
      const givenError = new Error("foo");
      jest
        .spyOn(ModelInfoService.prototype, "getAllModels")
        .mockResolvedValueOnce(givenMockData)
        .mockRejectedValue(givenError);

      // WHEN the ModelDirectory is mounted
      render(<ModelDirectory />);

      // THEN expect no errors or warning to have occurred
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      // AND expect the ModelsCardList to be visible
      const modelsCardList = screen.getByTestId(MODELS_CARD_LIST_DATA_TEST_ID.MODELS_CARD_LIST);
      expect(modelsCardList).toBeInTheDocument();
      // AND the ModelsCardList should receive the correct default props
      expect(ModelsCardList).toHaveBeenNthCalledWith(
        1,
        {
          models: [],
          isLoading: true,
          notifyOnExport: expect.any(Function),
          notifyOnExplore: expect.any(Function),
          notifyOnShowModelDetails: expect.any(Function),
          notifyOnRelease: expect.any(Function),
        },
        {}
      );
      // AND WHEN the ModelInfoService succeeds at first
      await waitFor(() => {
        // THEN expect the ModelsCardList to have been called with the correct props
        expect(ModelsCardList).toHaveBeenLastCalledWith(
          {
            models: givenMockData,
            isLoading: false,
            notifyOnExport: expect.any(Function),
            notifyOnExplore: expect.any(Function),
            notifyOnShowModelDetails: expect.any(Function),
            notifyOnRelease: expect.any(Function),
          },
          expect.anything()
        );
      });
      // AND WHEN the next poll fails (a process is still active, so polling continued), and its retries also fail
      // (waits out UPDATE_INTERVAL for the next poll, plus retry backoff before settling into the error state)
      await waitFor(
        () => {
          // THEN expect getUserFriendlyErrorMessage to have been called with the error
          expect(mockedGetUserFriendlyErrorMessage).toHaveBeenCalledWith(givenError);
        },
        { timeout: 35000 }
      );
      await waitFor(() => {
        // THEN expect a snackbar with the error message to be shown
        expect(useSnackbar().enqueueSnackbar).toHaveBeenCalledWith(FRIENDLY_ERROR_MESSAGE, {
          variant: "error",
          key: SNACKBAR_ID.INTERNET_ERROR,
          preventDuplicate: true,
        });
      });
      // AND the ModelsCardList to have been called with the previous props
      expect(ModelsCardList).toHaveBeenLastCalledWith(
        {
          models: givenMockData,
          isLoading: false,
          notifyOnExport: expect.any(Function),
          notifyOnExplore: expect.any(Function),
          notifyOnShowModelDetails: expect.any(Function),
          notifyOnRelease: expect.any(Function),
        },
        {}
      );
      // AND finally expect no warning to have occurred
      expect(console.warn).not.toHaveBeenCalled();
    }, 40000);

    test("should remove error snackbar when fetch model succeeds after it has failed", async () => {
      // GIVEN the model info service will fail every time until all its retries are exhausted, then succeed
      const givenModels = getArrayOfRandomModelsMaxLength(1);
      const givenError = new Error("foo");
      jest
        .spyOn(ModelInfoService.prototype, "getAllModels")
        .mockRejectedValueOnce(givenError)
        .mockRejectedValueOnce(givenError)
        .mockRejectedValueOnce(givenError)
        .mockRejectedValueOnce(givenError)
        .mockResolvedValue(givenModels);

      // WHEN the ModelDirectory is mounted
      render(<ModelDirectory />);

      // AND WHEN the ModelInfoService fails at first
      // (query retries a few times with backoff before settling into the error state)
      await waitFor(
        () => {
          // THEN expect getUserFriendlyErrorMessage to have been called with the error
          expect(mockedGetUserFriendlyErrorMessage).toHaveBeenCalledWith(givenError);
        },
        { timeout: 10000 }
      );
      await waitFor(() => {
        // AND expect a snackbar with the error message to be shown
        expect(useSnackbar().enqueueSnackbar).toHaveBeenCalledWith(FRIENDLY_ERROR_MESSAGE, {
          variant: "error",
          key: SNACKBAR_ID.INTERNET_ERROR,
          preventDuplicate: true,
        });
      });

      // AND WHEN the ModelInfoService succeeds on the next poll
      await waitFor(
        () => {
          // THEN expect a snackbar with the error message to be closed
          expect(useSnackbar().closeSnackbar).toHaveBeenCalledWith(SNACKBAR_ID.INTERNET_ERROR);
        },
        { timeout: 15000 }
      );
      // AND finally expect no warning to have occurred
      expect(console.warn).not.toHaveBeenCalled();
    }, 30000);

    test("should not fetch again after the ModelDirectory is unmounted", async () => {
      jest.useFakeTimers();
      // GIVEN a model with an import currently running, so the query keeps polling while mounted
      const givenRunningModel = getOneRandomModelMaxLength();
      givenRunningModel.importProcessState = {
        ...givenRunningModel.importProcessState,
        status: IMPORT_PROCESS_STATUS.RUNNING,
      };
      const getAllModelsSpy = jest
        .spyOn(ModelInfoService.prototype, "getAllModels")
        .mockResolvedValue([givenRunningModel]);

      // WHEN the ModelDirectory is mounted
      const { unmount } = render(<ModelDirectory />);

      // THEN expect no errors or warning to have occurred
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      // AND  expect the ModelDirectory to be visible
      const actualModelDirectory = screen.getByTestId(MODEL_DIRECTORY_DATA_TEST_ID.MODEL_DIRECTORY_PAGE);
      expect(actualModelDirectory).toBeInTheDocument();
      await waitFor(() => {
        expect(getAllModelsSpy).toHaveBeenCalledTimes(1);
      });

      // AND WHEN the ModelDirectory is unmounted
      unmount();
      // THEN expect the ModelDirectory to not be visible
      expect(actualModelDirectory).not.toBeInTheDocument();

      // AND WHEN time progresses well past UPDATE_INTERVAL
      act(() => {
        jest.advanceTimersByTime(UPDATE_INTERVAL * 3);
      });
      // THEN expect no further fetch to have been triggered, because the query was torn down on unmount
      expect(getAllModelsSpy).toHaveBeenCalledTimes(1);

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
      jest.spyOn(ModelInfoService.prototype, "getAllModels").mockRejectedValue(mockServiceError);

      // WHEN the ModelDirectory is mounted
      render(<ModelDirectory />);
      // AND the ModelInfoService fails

      // THEN expect a snackbar with the error message to be shown
      // (query retries a few times with backoff before settling into the error state)
      await waitFor(
        () => {
          expect(useSnackbar().enqueueSnackbar).toHaveBeenCalledWith(FRIENDLY_ERROR_MESSAGE, {
            variant: "error",
            key: SNACKBAR_ID.INTERNET_ERROR,
            preventDuplicate: true,
          });
        },
        { timeout: 10000 }
      );
      // AND writeServiceErrorToLog to have been called
      expect(writeServiceErrorToLog).toHaveBeenCalledWith(mockServiceError, console.error);
    }, 15000);

    describe("Internet status", () => {
      afterAll(() => {
        unmockBrowserIsOnLine();
      });

      test("should not fetch again while offline, and resume without an extra fetch once back online if the cached data is still fresh", async () => {
        // Testing the following scenario:
        //  (A) online -> render (fetch) ->
        //  (B) offline (no fetch) ->
        //  (C) online (no fetch, cached data is still fresh) ->
        //  (D) offline (no fetch)

        // GIVEN the model info service resolves with an empty list
        const getAllModelsSpy = jest.spyOn(ModelInfoService.prototype, "getAllModels").mockResolvedValue([]);

        // ----------------------------------------------
        // (A) online -> render (fetch)
        // ----------------------------------------------
        // AND the internet is initially online
        mockBrowserIsOnLine(true);

        // WHEN the model directory is rendered
        render(<ModelDirectory />);

        // THEN expect the models to have been fetched
        await waitFor(() => {
          expect(getAllModelsSpy).toHaveBeenCalledTimes(1);
        });

        // ----------------------------------------------
        // (B) offline (no fetch)
        // ----------------------------------------------

        // AND WHEN the internet goes offline
        act(() => mockBrowserIsOnLine(false));

        // THEN expect no further fetch to have been triggered while offline
        await new Promise((resolve) => setTimeout(resolve, 10));
        expect(getAllModelsSpy).toHaveBeenCalledTimes(1);

        // ----------------------------------------------
        // (C) online (no fetch, since the cached data is still within its stale time)
        // ----------------------------------------------

        // AND WHEN the internet goes online
        act(() => mockBrowserIsOnLine(true));

        // THEN expect no new fetch to have been triggered, since the cached data is still fresh
        await new Promise((resolve) => setTimeout(resolve, 10));
        expect(getAllModelsSpy).toHaveBeenCalledTimes(1);

        // ----------------------------------------------
        // (D) offline (no fetch)
        // ----------------------------------------------

        // AND WHEN the internet goes offline again
        act(() => mockBrowserIsOnLine(false));

        // THEN expect no further fetch to have been triggered
        await new Promise((resolve) => setTimeout(resolve, 10));
        expect(getAllModelsSpy).toHaveBeenCalledTimes(1);
      });

      test("when rendered is should not fetch data if the internet is offline", async () => {
        // GIVEN the model info service resolves with an empty list
        const getAllModelsSpy = jest.spyOn(ModelInfoService.prototype, "getAllModels").mockResolvedValue([]);

        // GIVEN that the internet will be offline
        mockBrowserIsOnLine(false);

        // WHEN the model directory is rendered
        render(<ModelDirectory />);

        // THEN expect getAllModels to not have been called
        expect(getAllModelsSpy).not.toHaveBeenCalled();
        // AND the card list is rendered with the isLoading state
        expect(ModelsCardList).toHaveBeenNthCalledWith(
          1,
          {
            models: [],
            isLoading: true,
            notifyOnExport: expect.any(Function),
            notifyOnExplore: expect.any(Function),
            notifyOnShowModelDetails: expect.any(Function),
            notifyOnRelease: expect.any(Function),
          },
          {}
        );

        // AND WHEN the internet goes online
        act(() => mockBrowserIsOnLine(true));
        // THEN expect getAllModels to have been called
        await waitFor(() => {
          expect(getAllModelsSpy).toHaveBeenCalled();
        });

        // THEN the card list is eventually not rendered in the isLoading state
        await waitFor(() => {
          expect(ModelsCardList).toHaveBeenLastCalledWith(
            {
              models: [],
              isLoading: false,
              notifyOnExport: expect.any(Function),
              notifyOnExplore: expect.any(Function),
              notifyOnShowModelDetails: expect.any(Function),
              notifyOnRelease: expect.any(Function),
            },
            expect.anything()
          );
        });

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

      // AND expect the ModelsCardList to have been called with the new model
      const modelsCardList = screen.getByTestId(MODELS_CARD_LIST_DATA_TEST_ID.MODELS_CARD_LIST);
      expect(modelsCardList).toBeInTheDocument();
      await waitFor(() => {
        expect(ModelsCardList).toHaveBeenCalledWith(
          {
            models: expect.arrayContaining([givenNewModel]),
            isLoading: expect.any(Boolean),
            notifyOnExport: expect.any(Function),
            notifyOnExplore: expect.any(Function),
            notifyOnShowModelDetails: expect.any(Function),
            notifyOnRelease: expect.any(Function),
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
    ])("should add the new model to the card list that %s", async (desc, givenExistingModels) => {
      // GIVEN the ModelDirectory is rendered with some existing models
      jest.spyOn(ModelInfoService.prototype, "getAllModels").mockResolvedValue(givenExistingModels);
      render(<ModelDirectory />);

      // AND the existing models have been fetched
      await waitFor(() => {
        expect(ModelsCardList).toHaveBeenLastCalledWith(
          expect.objectContaining({ models: givenExistingModels }),
          expect.anything()
        );
      });

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

      // THEN expect the ModelsCardList to have been called with the existing and the new model
      const modelsCardList = screen.getByTestId(MODELS_CARD_LIST_DATA_TEST_ID.MODELS_CARD_LIST);
      expect(modelsCardList).toBeInTheDocument();
      await waitFor(() => {
        expect(ModelsCardList).toHaveBeenCalledWith(
          {
            models: [givenNewModel, ...givenExistingModels],
            isLoading: false,
            notifyOnExport: expect.any(Function),
            notifyOnExplore: expect.any(Function),
            notifyOnShowModelDetails: expect.any(Function),
            notifyOnRelease: expect.any(Function),
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

  describe("ModelDirectory action tests: handleNotifyOnExport", () => {
    test("should handle export successfully", async () => {
      // GIVEN the ModelDirectory is rendered
      const givenModels = getArrayOfRandomModelsMaxLength(3);
      jest.spyOn(ModelInfoService.prototype, "getAllModels").mockResolvedValue(givenModels);
      render(<ModelDirectory />);
      // AND the existing models have been fetched
      await waitFor(() => {
        expect(ModelsCardList).toHaveBeenLastCalledWith(
          expect.objectContaining({ models: givenModels }),
          expect.anything()
        );
      });
      // AND the export will succeed
      const givenExportedModel = givenModels[1];
      ExportService.prototype.exportModel = jest.fn().mockResolvedValueOnce(givenExportedModel);

      // WHEN the user clicks the export button
      act(() => {
        const mock = (ModelsCardList as jest.Mock).mock;
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
      jest.spyOn(ModelInfoService.prototype, "getAllModels").mockResolvedValue(givenModels);
      render(<ModelDirectory />);
      // AND the existing models have been fetched
      await waitFor(() => {
        expect(ModelsCardList).toHaveBeenLastCalledWith(
          expect.objectContaining({ models: givenModels }),
          expect.anything()
        );
      });
      // AND the export will fail
      const givenExportedModel = givenModels[1];
      ExportService.prototype.exportModel = jest.fn().mockRejectedValueOnce(new Error("Export failed"));

      // WHEN the user clicks the export button
      act(() => {
        const mock = (ModelsCardList as jest.Mock).mock;
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
      jest.spyOn(ModelInfoService.prototype, "getAllModels").mockResolvedValue(givenModels);
      render(<ModelDirectory />);
      // AND the existing models have been fetched
      await waitFor(() => {
        expect(ModelsCardList).toHaveBeenLastCalledWith(
          expect.objectContaining({ models: givenModels }),
          expect.anything()
        );
      });
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
        const mock = (ModelsCardList as jest.Mock).mock;
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

  describe("ModelDirectory action tests: handleNotifyOnRelease", () => {
    test("should handle release successfully and update the model in the list", async () => {
      // GIVEN the ModelDirectory is rendered
      const givenModels = getArrayOfRandomModelsMaxLength(3);
      jest.spyOn(ModelInfoService.prototype, "getAllModels").mockResolvedValueOnce(givenModels);
      render(<ModelDirectory />);
      // AND the existing models have been fetched
      await waitFor(() => {
        expect(ModelsCardList).toHaveBeenLastCalledWith(
          expect.objectContaining({ models: givenModels }),
          expect.anything()
        );
      });
      // AND the release will succeed
      const givenModelToRelease = givenModels[1];
      const givenReleasedModel = { ...givenModelToRelease, released: true, releaseNotes: "some notes" };
      ModelInfoService.prototype.releaseModel = jest.fn().mockResolvedValueOnce(givenReleasedModel);

      // WHEN the user releases the model with some release notes
      act(() => {
        const mock = (ModelsCardList as jest.Mock).mock;
        mock.lastCall[0].notifyOnRelease(givenModelToRelease.id, "some notes");
      });

      // THEN expect the backdrop to be shown
      expect(Backdrop).toHaveBeenNthCalledWith(
        1,
        {
          isShown: true,
          message: "The model is being released. Please wait ...",
        },
        {}
      );
      // AND the releaseModel service to have been called with the modelId and releaseNotes
      expect(ModelInfoService.prototype.releaseModel).toHaveBeenCalledWith(givenModelToRelease.id, "some notes");
      // AND the model in the list to have been updated with the released model
      await waitFor(() => {
        expect((ModelsCardList as jest.Mock).mock.lastCall[0].models).toContainEqual(givenReleasedModel);
      });
      // AND the snackbar notification to be shown
      await waitFor(() => {
        expect(useSnackbar().enqueueSnackbar).toHaveBeenCalledWith(
          `The model '${givenModelToRelease.name}' has been released.`,
          {
            variant: "success",
            preventDuplicate: true,
          }
        );
      });
    });

    test("should update the model properties drawer when the released model is currently shown", async () => {
      // GIVEN the ModelDirectory is rendered
      const givenModels = getArrayOfRandomModelsMaxLength(3);
      jest.spyOn(ModelInfoService.prototype, "getAllModels").mockResolvedValueOnce(givenModels);
      render(<ModelDirectory />);
      // AND the existing models have been fetched
      await waitFor(() => {
        expect(ModelsCardList).toHaveBeenLastCalledWith(
          expect.objectContaining({ models: givenModels }),
          expect.anything()
        );
      });
      // AND the model's details drawer is currently open for that model
      const givenModelToRelease = givenModels[1];
      act(() => {
        (ModelsCardList as jest.Mock).mock.lastCall[0].notifyOnShowModelDetails(givenModelToRelease.id);
      });
      // AND the release will succeed
      const givenReleasedModel = { ...givenModelToRelease, released: true };
      ModelInfoService.prototype.releaseModel = jest.fn().mockResolvedValueOnce(givenReleasedModel);

      // WHEN the user releases that same model
      act(() => {
        (ModelsCardList as jest.Mock).mock.lastCall[0].notifyOnRelease(givenModelToRelease.id);
      });

      // THEN expect the drawer to have been updated with the released model
      await waitFor(() => {
        expect((ModelPropertiesDrawer as jest.Mock).mock.lastCall[0].model).toEqual(givenReleasedModel);
      });
    });

    test("should handle release failure", async () => {
      // GIVEN the ModelDirectory is rendered
      const givenModels = getArrayOfRandomModelsMaxLength(3);
      jest.spyOn(ModelInfoService.prototype, "getAllModels").mockResolvedValueOnce(givenModels);
      render(<ModelDirectory />);
      // AND the existing models have been fetched
      await waitFor(() => {
        expect(ModelsCardList).toHaveBeenLastCalledWith(
          expect.objectContaining({ models: givenModels }),
          expect.anything()
        );
      });
      // AND the release will fail
      const givenModelToRelease = givenModels[1];
      ModelInfoService.prototype.releaseModel = jest.fn().mockRejectedValueOnce(new Error("Release failed"));

      // WHEN the user releases the model
      act(() => {
        const mock = (ModelsCardList as jest.Mock).mock;
        mock.lastCall[0].notifyOnRelease(givenModelToRelease.id);
      });

      // THEN expect the backdrop to be shown
      expect(Backdrop).toHaveBeenNthCalledWith(
        1,
        {
          isShown: true,
          message: "The model is being released. Please wait ...",
        },
        {}
      );
      // AND the releaseModel service to have been called with the modelId
      expect(ModelInfoService.prototype.releaseModel).toHaveBeenCalledWith(givenModelToRelease.id, undefined);
      // AND the snackbar notification to be shown
      await waitFor(() => {
        expect(useSnackbar().enqueueSnackbar).toHaveBeenCalledWith(
          `The model '${givenModelToRelease.name}' could not be released. Please try again.`,
          {
            variant: "error",
            preventDuplicate: true,
          }
        );
      });
    });

    test("should throw a ServiceError when the release service fails to release", async () => {
      // GIVEN the ModelDirectory is rendered
      const givenModels = getArrayOfRandomModelsMaxLength(3);
      jest.spyOn(ModelInfoService.prototype, "getAllModels").mockResolvedValueOnce(givenModels);
      render(<ModelDirectory />);
      // AND the existing models have been fetched
      await waitFor(() => {
        expect(ModelsCardList).toHaveBeenLastCalledWith(
          expect.objectContaining({ models: givenModels }),
          expect.anything()
        );
      });
      // AND the release will fail with a ServiceError
      const givenModelToRelease = givenModels[1];
      const mockServiceError = new ServiceError(
        "ServiceName",
        "ServiceFunction",
        "PATCH",
        "/api/path",
        409,
        ErrorCodes.API_ERROR,
        "Service Error Message"
      );
      ModelInfoService.prototype.releaseModel = jest.fn().mockRejectedValueOnce(mockServiceError);

      // WHEN the user releases the model
      act(() => {
        const mock = (ModelsCardList as jest.Mock).mock;
        mock.lastCall[0].notifyOnRelease(givenModelToRelease.id);
      });

      // THEN expect the releaseModel service to have been called with the modelId
      expect(ModelInfoService.prototype.releaseModel).toHaveBeenCalledWith(givenModelToRelease.id, undefined);
      // AND the snackbar notification to be shown
      await waitFor(() => {
        expect(useSnackbar().enqueueSnackbar).toHaveBeenCalledWith(
          `The model '${givenModelToRelease.name}' could not be released. Please try again.`,
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

  describe("ModelDirectory action tests: handleNotifyOnShowModelDetails", () => {
    test("should show modelPropertiesDrawer successfully and then hide it", async () => {
      // GIVEN the ModelDirectory is rendered
      const givenModels = getArrayOfRandomModelsMaxLength(3);
      jest.spyOn(ModelInfoService.prototype, "getAllModels").mockResolvedValue(givenModels);
      render(<ModelDirectory />);
      // AND the existing models have been fetched
      await waitFor(() => {
        expect(ModelsCardList).toHaveBeenLastCalledWith(
          expect.objectContaining({ models: givenModels }),
          expect.anything()
        );
      });

      // WHEN the user clicks the show details button of some model
      const givenSelectedModel = givenModels[1];
      act(() => {
        const mock = (ModelsCardList as jest.Mock).mock;
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
      jest.spyOn(ModelInfoService.prototype, "getAllModels").mockResolvedValue(givenModels);
      render(<ModelDirectory />);
      // AND the existing models have been fetched
      await waitFor(() => {
        expect(ModelsCardList).toHaveBeenLastCalledWith(
          expect.objectContaining({ models: givenModels }),
          expect.anything()
        );
      });

      // WHEN the user clicks the show details button of some model
      const givenSelectedModel = "non-existing-id";
      act(() => {
        const mock = (ModelsCardList as jest.Mock).mock;
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
