// mute the console
import "src/_test_utilities/consoleMock";

import {act, render, screen,} from "@testing-library/react";
import ModelDirectory, {DATA_TEST_ID} from "./ModelDirectory";
import ImportModelDialog, {
  DATA_TEST_ID as IMPORT_DIALOG_DATA_TEST_ID, ImportData,
} from "src/import/ImportModelDialog";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import ImportDirectorService from "src/import/importDirector.service";
import {ILocale} from "api-specifications/modelInfo";
import {ImportFileTypes} from "api-specifications/import";
import {ImportFiles} from "../import/ImportFiles.type";

jest.mock("src/import/importDirector.service", () => {
  // Mocking the ES5 class
  const mockDirectorService = jest.fn(); // the constructor
  mockDirectorService.prototype.directImport = jest.fn();// adding a mock method
  return mockDirectorService;
});

jest.mock("src/import/ImportModelDialog", () => {
  const actual = jest.requireActual("../import/ImportModelDialog");
  const mockImportDialog = jest.fn().mockImplementation(() => {
    return <div data-testid={actual.DATA_TEST_ID.IMPORT_MODEL_DIALOG}> My Import Dialog Mock</div>
  });

  return {
    ...actual,
    __esModule: true,
    default: mockImportDialog,
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
    "UUID": "8e763c32-4c21-449c-94ee-7ddeb379369a",
    "name": "South Africa",
    "shortCode": "ZA"
  }
  return {name, description, locale, selectedFiles};
}

describe("ModelDirectory.ImportDialog action tests", () => {

  test("should show ImportDialog when import button is clicked", async () => {
    // GIVEN the ModelDirectory is rendered
    render(<ModelDirectory/>);

    // WHEN the import button is clicked
    const importButton = screen.getByTestId(DATA_TEST_ID.IMPORT_MODEL_BUTTON);
    await userEvent.click(importButton);

    // THEN expect the ImportDialog to be visible
    const importDialog = screen.getByTestId(IMPORT_DIALOG_DATA_TEST_ID.IMPORT_MODEL_DIALOG);
    expect(importDialog).toBeVisible();
  });

  test("should close ImportDialog and not import the model when cancel button is clicked", async () => {
    // GIVEN the ModelDirectory is rendered
    render(<ModelDirectory/>);

    // AND the user has opened the ImportDialog
    const importButton = screen.getByTestId(DATA_TEST_ID.IMPORT_MODEL_BUTTON);
    await userEvent.click(importButton);

    expect(screen.getByTestId(IMPORT_DIALOG_DATA_TEST_ID.IMPORT_MODEL_DIALOG)).toBeVisible();

    // AND the user clicks on cancel
    await act(() => {
      const mock = (ImportModelDialog as jest.Mock).mock;
      mock.lastCall[0].notifyOnClose({name: 'CANCEL'})
    });

    // THEN expect the ImportDialog to be rendered as closed
    expect(screen.queryByTestId(IMPORT_DIALOG_DATA_TEST_ID.IMPORT_MODEL_DIALOG)).toBeNull();

    // AND expect the import director service to not have been called
    expect(ImportDirectorService.prototype.directImport).toHaveBeenCalledTimes(0);
  });

  test("should close the Import Dialog and import the model when the user clicks the import button", async () => {
    // GIVEN the ModelDirectory is rendered
    render(<ModelDirectory/>);

    // AND the user has opened the ImportDialog
    const importButton = screen.getByTestId(DATA_TEST_ID.IMPORT_MODEL_BUTTON);
    await userEvent.click(importButton);

    expect(screen.getByTestId(IMPORT_DIALOG_DATA_TEST_ID.IMPORT_MODEL_DIALOG)).toBeVisible();

    // WHEN the user has entered all the data required for the import
    const givenImportData = getTestImportData();

    // AND the user clicks on import
    await act(() => {
      const mock = (ImportModelDialog as jest.Mock).mock;
      mock.lastCall[0].notifyOnClose({name: 'IMPORT', importData: givenImportData})
    });

    // THEN expect the ImportDialog to be rendered as closed
    expect(screen.queryByTestId(IMPORT_DIALOG_DATA_TEST_ID.IMPORT_MODEL_DIALOG)).toBeNull();

    // AND expect the import director service to have been called with the data entered by the user
    expect(ImportDirectorService.prototype.directImport).toHaveBeenCalledWith(givenImportData.name, givenImportData.description, givenImportData.locale, givenImportData.selectedFiles)
  });

  it('should throw an error when import director fails to import', async () => {
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
    const importButton = screen.getByTestId(DATA_TEST_ID.IMPORT_MODEL_BUTTON);
    await userEvent.click(importButton);

    expect(screen.getByTestId(IMPORT_DIALOG_DATA_TEST_ID.IMPORT_MODEL_DIALOG)).toBeVisible();

    // WHEN the user has entered all the data required for the import
    const givenImportData = getTestImportData();

    // AND the user click on import
    await act(() => {
      const mock = (ImportModelDialog as jest.Mock).mock;
      mock.lastCall[0].notifyOnClose({name: 'IMPORT', importData: givenImportData})
    });

    // THEN expect the ImportDialog to be rendered as closed
    expect(screen.queryByTestId(IMPORT_DIALOG_DATA_TEST_ID.IMPORT_MODEL_DIALOG)).toBeNull();

    // AND expect the import director service to have been called with the data entered by the user
    expect(ImportDirectorService.prototype.directImport).toHaveBeenCalledWith(givenImportData.name, givenImportData.description, givenImportData.locale, givenImportData.selectedFiles);

    // AND expect the error to be thrown
    expect(errorWasThrown).toBeTruthy();
  });
});