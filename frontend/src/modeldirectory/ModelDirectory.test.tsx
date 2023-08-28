// mute the console
import "src/_test_utilities/consoleMock";

import {act, render, screen, waitFor,} from "@testing-library/react";
import ModelDirectory, {availableLocales, DATA_TEST_ID as MODEL_DIR_DATA_TEST_ID} from "./ModelDirectory";
import ImportModelDialog, {DATA_TEST_ID as IMPORT_DIALOG_DATA_TEST_ID, ImportData,} from "src/import/ImportModelDialog";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import ImportDirectorService from "src/import/importDirector.service";
import {ILocale} from "api-specifications/modelInfo";
import {ImportFileTypes} from "api-specifications/import";
import {ImportFiles} from "../import/ImportFiles.type";
import {useSnackbar} from "src/theme/SnackbarProvider/SnackbarProvider";
import {Backdrop, DATA_TEST_ID as BACKDROP_DATA_TEST_ID} from "src/theme/Backdrop/Backdrop";
import ModelsTable, {DATA_TEST_ID as MODELS_TABLE_DATA_TEST_ID} from "./components/modelTables/ModelsTable";
import ModelInfoService from "src/service/modelInfo/modelInfo.service";
import {
  getOneRandomModelMaxLength,
  getArrayOfRandomModelsMaxLength
} from "./components/modelTables/_test_utilities/mockModelData";


// mock the model info service, as we do not want the real service to be called during testing
jest.mock("src/service/modelInfo/modelInfo.service", () => {
  // Mocking the ES5 class
  const mockModelInfoService = jest.fn(); // the constructor
  mockModelInfoService.prototype.createModel = jest.fn();// adding a mock method
  mockModelInfoService.prototype.getAllModels = jest.fn();// adding a mock method
  return mockModelInfoService;
});

// mock the import director service
jest.mock("src/import/importDirector.service", () => {
  // Mocking the ES5 class
  const mockDirectorService = jest.fn(); // the constructor
  mockDirectorService.prototype.directImport = jest.fn();// adding a mock method
  return mockDirectorService;
});

// mock the snackbar
jest.mock("src/theme/SnackbarProvider/SnackbarProvider", () => {
  return {
    useSnackbar: jest.fn().mockReturnValue({
      enqueueSnackbar: jest.fn()
    }),
  };
});

// mock the Backdrop
jest.mock("src/theme/Backdrop/Backdrop", () => {
  const actual = jest.requireActual("src/theme/Backdrop/Backdrop");
  const mockBackDrop = jest.fn().mockImplementation(() => {
    return <div data-testid={actual.DATA_TEST_ID.BACKDROP_CONTAINER}> My BackDrop Mock</div>
  });

  return {
    ...actual, __esModule: true, Backdrop: mockBackDrop,
  };
});

// mock the ImportModelDialog
jest.mock("src/import/ImportModelDialog", () => {
  const actual = jest.requireActual("../import/ImportModelDialog");
  const mockImportDialog = jest.fn().mockImplementation(() => {
    return <div data-testid={actual.DATA_TEST_ID.IMPORT_MODEL_DIALOG}> My Import Dialog Mock</div>
  });

  return {
    ...actual, __esModule: true, default: mockImportDialog,
  };
});

// mock the ModelsTable
jest.mock("src/modeldirectory/components/modelTables/ModelsTable", () => {
  const actual = jest.requireActual("src/modeldirectory/components/modelTables/ModelsTable");
  const mockModelsTable = jest.fn().mockImplementation(() => {
    console.log("ModelsTable mock");
    return <div data-testid={actual.DATA_TEST_ID.MODELS_TABLE_ID}> My Models Table</div>
  });

  return {
    ...actual, __esModule: true, default: mockModelsTable,
  };
});

function getTestImportData(): ImportData {
  // model name
  const name = 'My Model';
  // model description
  const description = 'My Model Description';
  // the import files
  const selectedFiles: ImportFiles = {};
  Object.values(ImportFileTypes).forEach((fileType: ImportFileTypes) => {
    selectedFiles[fileType] = new File(["foo bits"], `My File-${fileType}`, {type: 'text/plain'});
  });

  //The locale
  const locale: ILocale = {
    "UUID": "8e763c32-4c21-449c-94ee-7ddeb379369a", "name": "South Africa", "shortCode": "ZA"
  }
  return {name, description, locale, selectedFiles};
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("ModelDirectory Render", () => {

  test("Button renders", () => {
    // WHEN the ModelDirectory is mounted
    render(<ModelDirectory/>);

    // THEN expect the ImportButton to be visible
    const importButton = screen.getByTestId(MODEL_DIR_DATA_TEST_ID.IMPORT_MODEL_BUTTON);
    expect(importButton).toBeVisible();
  });

  test('ModelsTable initial render tests', async () => {
    // GIVEN the model info service has not resolved yet and will successfully resolve with some data
    const givenMockData = ["foo"] as any
    jest.spyOn(ModelInfoService.prototype, "getAllModels").mockResolvedValueOnce(givenMockData);

    // WHEN the ModelDirectory is mounted
    render(<ModelDirectory/>);

    // THEN expect the ModelsTable to be visible
    const modelsTable = screen.getByTestId(MODELS_TABLE_DATA_TEST_ID.MODELS_TABLE_ID);
    expect(modelsTable).toBeInTheDocument();

    // AND the ModelsTable should receive the correct default props.
    expect(ModelsTable).toHaveBeenNthCalledWith(1, {"models": [], isLoading: true}, {});

    // AND WHEN the ModelInfoService resolves
    await waitFor(() => {
      // THEN expect the ModelInfoService to have been called
      expect(ModelInfoService.prototype.getAllModels).toHaveBeenCalled();
    });
    // AND the ModelsTable should re-render with the resolved data and the loading prop should be set to false
    await waitFor(() => {
      expect(ModelsTable).toHaveBeenNthCalledWith(2, {"models": givenMockData, isLoading: false}, expect.anything());
    });
  });

  test('Shows error message when data fetching fails', async () => {
    // GIVEN the model info service will fail with some error
    const givenError = new Error("foo");
    jest.spyOn(ModelInfoService.prototype, "getAllModels").mockRejectedValueOnce(givenError);

    // WHEN the ModelDirectory is mounted
    render(<ModelDirectory/>);

    // THEN expect the ModelsTable to be visible
    const modelsTable = screen.getByTestId(MODELS_TABLE_DATA_TEST_ID.MODELS_TABLE_ID);
    expect(modelsTable).toBeInTheDocument();
    // AND the ModelsTable should receive the correct default props.
    expect(ModelsTable).toHaveBeenNthCalledWith(1, {"models": [], isLoading: true}, {});

    // AND WHEN the ModelInfoService fails
    await waitFor(() => {
      // THEN expect a snackbar with the error message to be shown
      expect(useSnackbar().enqueueSnackbar).toHaveBeenCalledWith(`Failed to fetch the models. Please check your internet connection.`, {variant: "error"});
    });
    // AND the ModelsTable props to be reset properly
    expect(ModelsTable).toHaveBeenNthCalledWith(2, {models: [], isLoading: false}, {})
  });
})
describe("ModelDirectory.ImportDialog action tests", () => {

  test("should show ImportDialog when import button is clicked", async () => {
    // GIVEN the ModelDirectory is rendered
    render(<ModelDirectory/>);

    // WHEN the import button is clicked
    const importButton = screen.getByTestId(MODEL_DIR_DATA_TEST_ID.IMPORT_MODEL_BUTTON);
    await userEvent.click(importButton);

    // THEN expect the ImportDialog to be visible
    const importDialog = screen.getByTestId(IMPORT_DIALOG_DATA_TEST_ID.IMPORT_MODEL_DIALOG);
    expect(importDialog).toBeVisible();

    // AND expect the import dialog to have been called with the correct props
    expect(ImportModelDialog).toHaveBeenCalledWith(expect.objectContaining({
      availableLocales: availableLocales, notifyOnClose: expect.any(Function),
    }), {});
  });

  test("should close ImportDialog and not import the model when cancel button is clicked", async () => {
    // GIVEN the ModelDirectory is rendered
    render(<ModelDirectory/>);

    // AND the user has opened the ImportDialog
    const importButton = screen.getByTestId(MODEL_DIR_DATA_TEST_ID.IMPORT_MODEL_BUTTON);
    await userEvent.click(importButton);

    expect(screen.getByTestId(IMPORT_DIALOG_DATA_TEST_ID.IMPORT_MODEL_DIALOG)).toBeVisible();

    // AND the user clicks on cancel
    act(() => {
      const mock = (ImportModelDialog as jest.Mock).mock;
      mock.lastCall[0].notifyOnClose({name: 'CANCEL'})
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
    render(<ModelDirectory/>);

    // AND the import will succeed and a new model will be created
    const givenNewModel = getOneRandomModelMaxLength();
    ImportDirectorService.prototype.directImport = jest.fn().mockResolvedValueOnce(givenNewModel);

    // AND the user has opened the ImportDialog
    const importButton = screen.getByTestId(MODEL_DIR_DATA_TEST_ID.IMPORT_MODEL_BUTTON);
    await userEvent.click(importButton);

    expect(screen.getByTestId(IMPORT_DIALOG_DATA_TEST_ID.IMPORT_MODEL_DIALOG)).toBeVisible();

    // WHEN the user has entered all the data required for the import
    const givenImportData = getTestImportData();

    // AND the user clicks on import
    act(() => {
      const mock = (ImportModelDialog as jest.Mock).mock;
      mock.lastCall[0].notifyOnClose({name: 'IMPORT', importData: givenImportData})
    });

    // THEN expect the ImportDialog to be rendered as closed
    expect(screen.queryByTestId(IMPORT_DIALOG_DATA_TEST_ID.IMPORT_MODEL_DIALOG)).toBeNull();

    // AND the backdrop was shown
    expect(Backdrop).toHaveBeenNthCalledWith(1, {isShown: true, message: expect.any(String)}, {});

    // AND expect the import director service to have been called with the data entered by the user
    expect(ImportDirectorService.prototype.directImport).toHaveBeenCalledWith(givenImportData.name, givenImportData.description, givenImportData.locale, givenImportData.selectedFiles);

    // AND expect the ModelsTable to have been called with the new model
    const modelsTable = screen.getByTestId(MODELS_TABLE_DATA_TEST_ID.MODELS_TABLE_ID);
    expect(modelsTable).toBeInTheDocument();
    await waitFor(() => {
      expect(ModelsTable).toHaveBeenCalledWith({"models": expect.arrayContaining([givenNewModel]), "isLoading": false}, expect.anything());
    });

    // AND the backdrop was eventually hidden
    await waitFor(() => {
      const backdrop = screen.queryByTestId(BACKDROP_DATA_TEST_ID.BACKDROP_CONTAINER);
      expect(backdrop).not.toBeInTheDocument();
    });

    // AND the snackbar notification was shown
    expect(useSnackbar().enqueueSnackbar).toHaveBeenCalledWith(`The model '${givenImportData.name}' import has started.`, {variant: "success"});
  });

  test('should throw an error when import director fails to import', async () => {

    // GIVEN the ModelDirectory is rendered
    render(<ModelDirectory/>);
    // AND the import will fail
    const mockError = new Error('Import failed');
    let errorWasThrown = false;
    ImportDirectorService.prototype.directImport = jest.fn().mockImplementation(() => new Promise((resolve, reject) => {
      errorWasThrown = true;
      reject(mockError);
    }));

    // AND the user has opened the ImportDialog
    const importButton = screen.getByTestId(MODEL_DIR_DATA_TEST_ID.IMPORT_MODEL_BUTTON);
    await userEvent.click(importButton);

    expect(screen.getByTestId(IMPORT_DIALOG_DATA_TEST_ID.IMPORT_MODEL_DIALOG)).toBeVisible();

    // WHEN the user has entered all the data required for the import
    const givenImportData = getTestImportData();

    // AND the user click on import
    act(() => {
      const mock = (ImportModelDialog as jest.Mock).mock;
      mock.lastCall[0].notifyOnClose({name: 'IMPORT', importData: givenImportData})
    });

    // THEN expect the ImportDialog to be rendered as closed
    expect(screen.queryByTestId(IMPORT_DIALOG_DATA_TEST_ID.IMPORT_MODEL_DIALOG)).toBeNull();

    // AND the backdrop was shown
    expect(Backdrop).toHaveBeenNthCalledWith(1, {isShown: true, message: expect.any(String)}, {});

    // AND expect the import director service to have been called with the data entered by the user
    expect(ImportDirectorService.prototype.directImport).toHaveBeenCalledWith(givenImportData.name, givenImportData.description, givenImportData.locale, givenImportData.selectedFiles);

    // AND the backdrop was eventually hidden
    await waitFor(() => {
      const backdrop = screen.queryByTestId(BACKDROP_DATA_TEST_ID.BACKDROP_CONTAINER);
      expect(backdrop).not.toBeInTheDocument();
    });

    // AND expect the error to be thrown
    expect(errorWasThrown).toBeTruthy();

    // AND the snackbar notification was shown
    expect(useSnackbar().enqueueSnackbar).toHaveBeenCalledWith(`The model '${givenImportData.name}' import could not be started. Please try again.`, {variant: "error"});
  });

  test.each([
    [" has no existing models", []],
    [" has N existing models", getArrayOfRandomModelsMaxLength(3)],
  ])
  ("should add the new model to the table that %s", async (desc, givenExistingModels) => {
    // GIVEN the ModelDirectory is rendered with some existing models
    jest.spyOn(ModelInfoService.prototype, "getAllModels").mockResolvedValueOnce(givenExistingModels);
    render(<ModelDirectory/>);

    // AND the import will succeed and a new model will be created
    const givenNewModel = getOneRandomModelMaxLength()
    ImportDirectorService.prototype.directImport = jest.fn().mockResolvedValueOnce(givenNewModel);

    // AND the user has opened the ImportDialog
    const importButton = screen.getByTestId(MODEL_DIR_DATA_TEST_ID.IMPORT_MODEL_BUTTON);
    await userEvent.click(importButton);

    // AND the user has entered all the data required for the import
    const givenImportData = getTestImportData();

    // AND the user click on import
    act(() => {
      const mock = (ImportModelDialog as jest.Mock).mock;
      mock.lastCall[0].notifyOnClose({name: 'IMPORT', importData: givenImportData})
    });

    // AND expect the ModelsTable to have been called with the existing and the new model
    const modelsTable = screen.getByTestId(MODELS_TABLE_DATA_TEST_ID.MODELS_TABLE_ID);
    expect(modelsTable).toBeInTheDocument();
    await waitFor(() => {
      expect(ModelsTable).toHaveBeenLastCalledWith({"models": [givenNewModel, ...givenExistingModels], "isLoading": false}, expect.anything());
    });
  });
});