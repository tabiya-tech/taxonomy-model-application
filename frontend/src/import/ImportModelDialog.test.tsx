// mute the console
import "src/_test_utilities/consoleMock";

// ##############################
// Setup import.service mock
// ##############################
import {render, screen} from "src/_test_utilities/test-utils";
import ImportModelDialog, {DATA_TEST_ID, ImportModelDialogProps} from "./ImportModelDialog";
import {DATA_TEST_ID as MODEL_NAME_FIELD_DATA_TEST_ID} from "src/import/components/ModelNameField";
import {DATA_TEST_ID as MODEL_DESCRIPTION_FIELD_DATA_TEST_ID} from "src/import/components/ModelDescriptionField";
import {DATA_TEST_ID as IMPORT_FILE_SELECTION_DATA_TEST_ID} from "src/import/components/ImportFilesSelection";
import {DATA_TEST_ID as FILE_ENTRY_DATA_TEST_ID} from "src/import/components/FileEntry";

import {fireEvent, waitFor} from "@testing-library/react";
import ImportDirectorService from "./importDirector.service";
import {getMockId} from "src/_test_utilities/mockMongoId";
import {ImportFileTypes} from "api-specifications/import";
import {ILocale} from "api-specifications/modelInfo";
import {typeDebouncedInput} from "src/_test_utilities/userEventFakeTimer";

jest.mock("./importDirector.service", () => {
  // Mocking the ES5 class
  const mockDirectorService = jest.fn(); // the constructor
  mockDirectorService.prototype.directImport = jest.fn();// adding a mock method
  return mockDirectorService;
});
const notifyOnCloseMock = jest.fn();
const props: ImportModelDialogProps = {
  isOpen: true,
  notifyOnClose: notifyOnCloseMock,
};

beforeEach(
  () => {
    // Clear all instances and calls to constructor and all methods:
    // @ts-ignore
    ImportDirectorService.prototype.directImport.mockReset();
    notifyOnCloseMock.mockReset();
  }
)
describe("ImportModel dialog render tests", () => {
  it("should render the dialog visible", () => {
    //GIVEN the dialog is visible
    render(<ImportModelDialog {...props}/>);

    //THEN expect the dialog to be in the document
    const dialogBox = screen.getByTestId(DATA_TEST_ID.IMPORT_MODEL_DIALOG);
    expect(dialogBox).toBeInTheDocument();
    // AND expect the Import button to exist
    const importButtonElement = screen.getByTestId(DATA_TEST_ID.IMPORT_BUTTON);
    expect(importButtonElement).toBeInTheDocument();
    // AND expect the Cancel button to exist
    const cancelButtonElement = screen.getByTestId(DATA_TEST_ID.CANCEL_BUTTON);
    expect(cancelButtonElement).toBeInTheDocument();
    // AND expect the Model Name field to exist
    const modelNameElement = screen.getByTestId(MODEL_NAME_FIELD_DATA_TEST_ID.MODEL_NAME_FIELD);
    expect(modelNameElement).toBeInTheDocument();
    // AND expect the Model Description field to exist
    const modelDescriptionElement = screen.getByTestId(MODEL_DESCRIPTION_FIELD_DATA_TEST_ID.MODEL_DESCRIPTION_FIELD);
    expect(modelDescriptionElement).toBeInTheDocument();
    // AND expect the Import Files Selection to exist
    const importFilesSelectionElement = screen.getByTestId(IMPORT_FILE_SELECTION_DATA_TEST_ID.IMPORT_FILES_SELECTION);
    expect(importFilesSelectionElement).toBeInTheDocument();
  });

  it('should render the dialog hidden', function () {
    // GIVEN the dialog is hidden
    const props: ImportModelDialogProps = {
      isOpen: false,
      notifyOnClose: notifyOnCloseMock,
    }
    // WHEN the dialog is rendered
    render(<ImportModelDialog {...props}/>);
    // THEN expect the dialog to not be in the document
    const dialogBox = screen.queryByTestId(DATA_TEST_ID.IMPORT_MODEL_DIALOG);
    expect(dialogBox).not.toBeInTheDocument();
  });
});

async function fillInImportDialog() {
  const enteredModelName = 'My Model';
  const modelNameElement = screen.getByTestId(MODEL_NAME_FIELD_DATA_TEST_ID.MODEL_NAME_INPUT);
  await typeDebouncedInput(modelNameElement, enteredModelName);

  // User enters a model description
  const enteredModelDescription = 'My Model Description';
  const modelDescriptionElement = screen.getByTestId(MODEL_DESCRIPTION_FIELD_DATA_TEST_ID.MODEL_DESC_INPUT);
  await typeDebouncedInput(modelDescriptionElement, enteredModelDescription);

  // User selects the import files
  const selectedFiles: { fileType: ImportFileTypes, file: File }[] = [];
  const importFilesSelectionElement: HTMLInputElement[] = screen.getAllByTestId(FILE_ENTRY_DATA_TEST_ID.FILE_INPUT);
  importFilesSelectionElement.forEach((element, index) => {
    const file = new File(["foo bits"], 'My File' + index, {type: 'text/plain'});
    selectedFiles.push({fileType: element.getAttribute('data-filetype') as ImportFileTypes, file: file})
    fireEvent.change(element, {target: {files: [file]}});
  });

  // User select the locale
  const selectedLocale: ILocale = {
    "UUID": "8e763c32-4c21-449c-94ee-7ddeb379369a",
    "name": "South Africa",
    "shortCode": "ZA"
  }
  return {enteredModelName, enteredModelDescription, selectedFiles, selectedLocale};
}

describe('ImportModel dialog action tests', () => {

  it('should call notifyOnClose with CANCEL when Escape key is pressed', () => {
    // GIVEN
    render(<ImportModelDialog {...props} />);

    // WHEN Escape key is pressed
    fireEvent.keyDown(screen.getByTestId(DATA_TEST_ID.IMPORT_MODEL_DIALOG), {key: 'Escape'});

    // THEN
    expect(notifyOnCloseMock).toHaveBeenCalledWith({name: 'CANCEL'});
  });

  it('should call notifyOnClose with CANCEL when Cancel button is clicked', () => {
    // GIVEN the dialog is visible
    render(<ImportModelDialog {...props} />);

    const cancelButton = screen.getByTestId(DATA_TEST_ID.CANCEL_BUTTON);
    // WHEN Cancel button is clicked
    fireEvent.click(cancelButton);

    // THEN expect the import button to exist
    expect(notifyOnCloseMock).toHaveBeenCalledWith({name: 'CANCEL'});
  });

  it('should call notifyOnClose with SUCCESS when Import button is clicked and import is successful', async () => {
    // GIVEN the dialog is visible
    render(<ImportModelDialog {...props} />);
    // AND the import will be successful
    const givenModelId = getMockId(1);
    ImportDirectorService.prototype.directImport = jest.fn().mockResolvedValueOnce(givenModelId);

    // WHEN the user enters all the data required for the import
    const data = await fillInImportDialog();
    // AND the Import button is clicked
    const importButton = screen.getByTestId(DATA_TEST_ID.IMPORT_BUTTON);
    fireEvent.click(importButton);

    // THEN expect the import director service to be called
    expect(ImportDirectorService.prototype.directImport).toHaveBeenCalledWith(data.enteredModelName, data.enteredModelDescription, data.selectedLocale, data.selectedFiles)
    await waitFor(() => {
      // AND the notifyOnClose to be called with SUCCESS and the new model id
      expect(notifyOnCloseMock).toHaveBeenCalledWith({name: 'SUCCESS', modelid: givenModelId});
    });
  });

  it('should not call notifyOnClose when Import button is clicked and import is not unsuccessful', async () => {

    // GIVEN the dialog is visible
    render(<ImportModelDialog {...props} />);
    // AND the import will fail
    ImportDirectorService.prototype.directImport = jest.fn().mockRejectedValueOnce(new Error('Import failed'));

    // WHEN the user enters all the data required for the import
    const data = await fillInImportDialog();

    // AND the Import button is clicked
    const importButton = screen.getByTestId(DATA_TEST_ID.IMPORT_BUTTON);

    fireEvent.click(importButton);
    // THEN expect the import director service to have been called
    expect(ImportDirectorService.prototype.directImport).toHaveBeenCalledWith(data.enteredModelName, data.enteredModelDescription, data.selectedLocale, data.selectedFiles)
    await waitFor(() => {
      // AND the notifyOnClose to not have been called
      expect(notifyOnCloseMock).not.toHaveBeenCalled();
    });
  });
});
