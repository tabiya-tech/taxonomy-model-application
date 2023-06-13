// mute the console
import "src/_test_utilities/consoleMock";


import {render, screen, getByTestId} from "src/_test_utilities/test-utils";
import ImportModelDialog, {DATA_TEST_ID, ImportModelDialogProps} from "./ImportModelDialog";
import {DATA_TEST_ID as MODEL_NAME_FIELD_DATA_TEST_ID} from "src/import/components/ModelNameField";
import {DATA_TEST_ID as MODEL_DESCRIPTION_FIELD_DATA_TEST_ID} from "src/import/components/ModelDescriptionField";
import {DATA_TEST_ID as IMPORT_FILE_SELECTION_DATA_TEST_ID} from "src/import/components/ImportFilesSelection";
import {DATA_TEST_ID as FILE_ENTRY_DATA_TEST_ID} from "src/import/components/FileEntry";

import {fireEvent} from "@testing-library/react";
import {ImportFileTypes} from "api-specifications/import";
import {ILocale} from "api-specifications/modelInfo";
import {clickDebouncedButton, typeDebouncedInput} from "src/_test_utilities/userEventFakeTimer";
import {ImportFiles} from "./ImportFiles.type";

const notifyOnCloseMock = jest.fn();
const props: ImportModelDialogProps = {
  isOpen: true,
  notifyOnClose: notifyOnCloseMock,
};

beforeEach(
  () => {
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
  const selectedFiles: ImportFiles = {};

  const importFilesSelectionElement: HTMLInputElement[] = screen.getAllByTestId(FILE_ENTRY_DATA_TEST_ID.FILE_INPUT);
  importFilesSelectionElement.forEach((element, index) => {
    const file = new File(["foo bits"], 'My File' + index, {type: 'text/plain'});
    selectedFiles[element.getAttribute('data-filetype') as ImportFileTypes] = file;
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
    // GIVEN the dialog is visible
    render(<ImportModelDialog {...props} />);

    // WHEN Escape key is pressed
    fireEvent.keyDown(screen.getByTestId(DATA_TEST_ID.IMPORT_MODEL_DIALOG), {key: 'Escape'});

    // THEN expect the notifyOnClose to be called with CANCEL
    expect(notifyOnCloseMock).toHaveBeenCalledWith({name: 'CANCEL'});
  });

  it('should call notifyOnClose with CANCEL when Cancel button is clicked', () => {
    // GIVEN the dialog is visible
    render(<ImportModelDialog {...props} />);

    const cancelButton = screen.getByTestId(DATA_TEST_ID.CANCEL_BUTTON);
    // WHEN Cancel button is clicked
    fireEvent.click(cancelButton);

    // THEN expect the notifyOnClose to be called with CANCEL
    expect(notifyOnCloseMock).toHaveBeenCalledWith({name: 'CANCEL'});
  });

  it('should call notifyOnClose with IMPORT and model data when Import button is clicked', async () => {
    // GIVEN the dialog is visible
    render(<ImportModelDialog {...props} />);

    // WHEN the user enters all the data required for the import
    const givenData = await fillInImportDialog();

    // AND the user clicks the import button
    const importButton = screen.getByTestId(DATA_TEST_ID.IMPORT_BUTTON);
    fireEvent.click(importButton);

    // THEN the notifyOnClose is called with event name IMPORT and the data the user entered
    expect(notifyOnCloseMock).toHaveBeenCalledWith({
      name: 'IMPORT',
      importData: {
        name: givenData.enteredModelName,
        description: givenData.enteredModelDescription,
        locale: givenData.selectedLocale,
        selectedFiles: givenData.selectedFiles
      }
    });
  });

  it('should call notifyOnClose with IMPORT and the correct selected files when some files where removed by the user', async () => {
    // GIVEN the dialog is visible

    render(<ImportModelDialog {...props} />);
    // WHEN the user enters all the data required for the import
    const givenData = await fillInImportDialog();

    // AND the user removes one of the files
    const givenFileTypeToRemove = ImportFileTypes.ESCO_SKILL_GROUP;

    const fileEntries = screen.getAllByTestId(FILE_ENTRY_DATA_TEST_ID.FILE_ENTRY);
    //const removeSelectedFileButtons: HTMLInputElement[] = screen.getAllByTestId(FILE_ENTRY_DATA_TEST_ID.REMOVE_SELECTED_FILE_BUTTON);

    let removedFile: boolean = false;
    for (const element of fileEntries) {
      if (element.getAttribute('data-filetype') === givenFileTypeToRemove) {
        // eslint-disable-next-line testing-library/prefer-screen-queries
        const removeSelectedFileButton = getByTestId(element, FILE_ENTRY_DATA_TEST_ID.REMOVE_SELECTED_FILE_BUTTON);
        await clickDebouncedButton(removeSelectedFileButton);
        removedFile = true;
      }
    }
    // guard to make sure we actually removed a file
    expect(removedFile).toEqual(true);

    // AND  the user clicks the import button
    const importButton = screen.getByTestId(DATA_TEST_ID.IMPORT_BUTTON);
    fireEvent.click(importButton);

    // THEN the notifyOnClose is called with event name IMPORT and the data the user entered except the removed file
    const expectedFiles = givenData.selectedFiles;
    delete expectedFiles[givenFileTypeToRemove];

    expect(notifyOnCloseMock).toHaveBeenCalledWith({
      name: 'IMPORT',
      importData: {
        name: givenData.enteredModelName,
        description: givenData.enteredModelDescription,
        locale: givenData.selectedLocale,
        selectedFiles: expectedFiles
      }
    })
  })
});
