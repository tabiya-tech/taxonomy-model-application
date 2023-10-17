// mute the console
import "src/_test_utilities/consoleMock";

import { getByTestId, render, screen, fireEvent, within } from "src/_test_utilities/test-utils";
import ImportModelDialog, { DATA_TEST_ID, ImportData, ImportModelDialogProps } from "./ImportModelDialog";
import { DATA_TEST_ID as MODEL_NAME_FIELD_DATA_TEST_ID } from "src/import/components/ModelNameField";
import { DATA_TEST_ID as MODEL_LOCALE_SELECT_FIELD_DATA_TEST_ID } from "src/import/components/ModelLocalSelectField";
import { DATA_TEST_ID as MODEL_DESCRIPTION_FIELD_DATA_TEST_ID } from "src/import/components/ModelDescriptionField";
import { DATA_TEST_ID as IMPORT_FILE_SELECTION_DATA_TEST_ID } from "src/import/components/ImportFilesSelection";
import { DATA_TEST_ID as FILE_ENTRY_DATA_TEST_ID } from "src/import/components/FileEntry";
import ImportAPISpecs from "api-specifications/import";
import { clickDebouncedButton, typeDebouncedInput } from "src/_test_utilities/userEventFakeTimer";
import { ImportFiles } from "./ImportFiles.type";
import { isSpecified } from "src/utils/isUnspecified";
import userEvent from "@testing-library/user-event";
import { unmockBrowserIsOnLine } from "src/_test_utilities/mockBrowserIsOnline";
import * as PrimaryButtonModule from "src/theme/PrimaryButton/PrimaryButton";

const notifyOnCloseMock = jest.fn();
const testProps: ImportModelDialogProps = {
  isOpen: true,
  availableLocales: [
    {
      name: "foo",
      shortCode: "foo",
      UUID: "foo",
    },
    {
      name: "bar",
      shortCode: "bar",
      UUID: "bar",
    },
  ],
  notifyOnClose: notifyOnCloseMock,
};

function getImportDataTestValues(): ImportData {
  return {
    name: "foo model name",
    description: "foo model description",
    locale: testProps.availableLocales[1],
    selectedFiles: Object.values(ImportAPISpecs.Constants.ImportFileTypes).reduce((acc, fileType) => {
      acc[fileType] = new File([fileType], fileType, { type: "text/plain" });
      return acc;
    }, {} as ImportFiles),
  };
}

async function fillInImportDialog(inputData: ImportData): Promise<void> {
  // Select the model name
  if (isSpecified(inputData.name)) {
    const modelNameElement = screen.getByTestId(MODEL_NAME_FIELD_DATA_TEST_ID.MODEL_NAME_INPUT);
    await typeDebouncedInput(modelNameElement, inputData.name);
  }

  // Select the description
  if (isSpecified(inputData.description)) {
    const modelDescriptionElement = screen.getByTestId(MODEL_DESCRIPTION_FIELD_DATA_TEST_ID.MODEL_DESC_INPUT);
    await typeDebouncedInput(modelDescriptionElement, inputData.description);
  }

  // Selecting the locale
  const dropdownElement = screen.getByTestId(MODEL_LOCALE_SELECT_FIELD_DATA_TEST_ID.MODEL_LOCALE_DROPDOWN);
  const button = within(dropdownElement).getByRole("button");
  await userEvent.click(button);
  const dropdownList = screen.getAllByTestId(MODEL_LOCALE_SELECT_FIELD_DATA_TEST_ID.MODEL_LOCALE_ITEM);
  const targetLocaleElement = dropdownList.find((item) => item.getAttribute("data-value") === inputData.locale.UUID);
  await userEvent.click(targetLocaleElement as HTMLElement);

  // Select the import files
  const importFilesSelectionElement: HTMLInputElement[] = screen.getAllByTestId(FILE_ENTRY_DATA_TEST_ID.FILE_INPUT);
  importFilesSelectionElement.forEach((element) => {
    const elementFileType = element.getAttribute("data-filetype") as ImportAPISpecs.Constants.ImportFileTypes;
    if (inputData.selectedFiles[elementFileType] !== undefined) {
      fireEvent.change(element, { target: { files: [inputData.selectedFiles[elementFileType]] } });
    }
  });
}

beforeEach(() => {
  unmockBrowserIsOnLine();
  notifyOnCloseMock.mockReset();
  (console.error as jest.Mock).mockClear();
  (console.warn as jest.Mock).mockClear();
});

describe("ImportModel dialog render tests", () => {
  it("should render the dialog visible", () => {
    //GIVEN the dialog is visible
    render(<ImportModelDialog {...testProps} />);

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND the dialog to be in the document
    const dialogBox = screen.getByTestId(DATA_TEST_ID.IMPORT_MODEL_DIALOG);
    expect(dialogBox).toBeInTheDocument();
    // AND to match the snapshot
    expect(dialogBox).toMatchSnapshot();
    // AND expect the Import button to exist
    const importButtonElement = screen.getByTestId(DATA_TEST_ID.IMPORT_BUTTON);
    expect(importButtonElement).toBeInTheDocument();
    // AND expect the Cancel button to exist
    const cancelButtonElement = screen.getByTestId(DATA_TEST_ID.CANCEL_BUTTON);
    expect(cancelButtonElement).toBeInTheDocument();
    // AND expect the Model Name field to exist
    const modelNameElement = screen.getByTestId(MODEL_NAME_FIELD_DATA_TEST_ID.MODEL_NAME_FIELD);
    expect(modelNameElement).toBeInTheDocument();
    // AND expect the Model Locale field to exist
    const modelLocaleElement = screen.getByTestId(MODEL_LOCALE_SELECT_FIELD_DATA_TEST_ID.MODEL_LOCALE_SELECT_FIELD);
    expect(modelLocaleElement).toBeInTheDocument();
    // AND expect the Model Description field to exist
    const modelDescriptionElement = screen.getByTestId(MODEL_DESCRIPTION_FIELD_DATA_TEST_ID.MODEL_DESCRIPTION_FIELD);
    expect(modelDescriptionElement).toBeInTheDocument();
    // AND expect the Import Files Selection to exist
    const importFilesSelectionElement = screen.getByTestId(IMPORT_FILE_SELECTION_DATA_TEST_ID.IMPORT_FILES_SELECTION);
    expect(importFilesSelectionElement).toBeInTheDocument();
  });

  it("should render the dialog hidden", function () {
    // GIVEN the dialog is hidden
    const givenProps: ImportModelDialogProps = {
      ...testProps,
      isOpen: false,
    };
    // WHEN the dialog is rendered
    render(<ImportModelDialog {...givenProps} />);

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND the dialog to not be in the document
    const dialogBox = screen.queryByTestId(DATA_TEST_ID.IMPORT_MODEL_DIALOG);
    expect(dialogBox).not.toBeInTheDocument();
  });

  it.each([
    [
      "name is missing",
      () => {
        const data = getImportDataTestValues();
        data.name = "";
        return data;
      },
    ],
    /* This test cannot be done, as the user cannot select an empty locale, unless there are no locales in which case there is something wrong already with the code.
    ["locale is missing", () => {
      const data = getImportDataTestValues();
      data.locale = undefined as any;
      return data;
    }],
    */
    [
      "selectedFiles are missing",
      () => {
        const data = getImportDataTestValues();
        data.selectedFiles = {};
        return data;
      },
    ],
  ])("should render the import button disabled when mandatory fields %s", async (description, getTestData) => {
    // GIVEN the dialog is rendered
    jest.spyOn(PrimaryButtonModule, "default");
    render(<ImportModelDialog {...testProps} />);

    // WHEN the user does not enter any of the mandatory data
    await fillInImportDialog(getTestData());
    const importButton: HTMLButtonElement = screen.getByTestId(DATA_TEST_ID.IMPORT_BUTTON);

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND importButton to be disabled
    expect(importButton).toBeDisabled();

    // AND expect the PrimaryButton to bebe disabled when offline
    expect(PrimaryButtonModule.default).toHaveBeenCalledWith(
      expect.objectContaining({ disabled: true, disableWhenOffline: true }),
      {}
    );
  });

  it("should render the import button enabled if all mandatory fields are filled and the browser is online", async function () {
    // GIVEN the dialog is visible
    jest.spyOn(PrimaryButtonModule, "default");
    render(<ImportModelDialog {...testProps} />);
    // AND given the mandatory
    const givenMandatoryFields = getImportDataTestValues();

    // WHEN the user enters all the data required for the import
    await fillInImportDialog(givenMandatoryFields);
    const importButton = screen.getByTestId(DATA_TEST_ID.IMPORT_BUTTON);

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND import button to be enabled
    expect(importButton).toBeEnabled();

    // AND expect the PrimaryButton to be disabled when offline
    expect(PrimaryButtonModule.default).toHaveBeenCalledWith(
      expect.objectContaining({ disabled: false, disableWhenOffline: true }),
      {}
    );
  });
});

describe("ImportModel dialog action tests", () => {
  it("should call notifyOnClose with CANCEL when Escape key is pressed", () => {
    // GIVEN
    render(<ImportModelDialog {...testProps} />);

    // WHEN Escape key is pressed
    fireEvent.keyDown(screen.getByTestId(DATA_TEST_ID.IMPORT_MODEL_DIALOG), { key: "Escape" });

    // THEN
    expect(notifyOnCloseMock).toHaveBeenCalledWith({ name: "CANCEL" });
  });

  it("should call notifyOnClose with CANCEL when Cancel button is clicked", () => {
    // GIVEN the dialog is visible
    render(<ImportModelDialog {...testProps} />);

    const cancelButton = screen.getByTestId(DATA_TEST_ID.CANCEL_BUTTON);
    // WHEN Cancel button is clicked
    fireEvent.click(cancelButton);

    // THEN expect the notifyOnClose to be called with CANCEL
    expect(notifyOnCloseMock).toHaveBeenCalledWith({ name: "CANCEL" });
  });

  it("should call notifyOnClose with IMPORT and model data when Import button is clicked", async () => {
    // GIVEN the dialog is visible
    render(<ImportModelDialog {...testProps} />);

    // WHEN the user enters all the data required for the import
    // @ts-ignore
    const givenData = getImportDataTestValues();
    await fillInImportDialog(givenData);

    // AND the user clicks the import button
    const importButton = screen.getByTestId(DATA_TEST_ID.IMPORT_BUTTON);
    fireEvent.click(importButton);

    // THEN the notifyOnClose is called with event name IMPORT and the data the user entered
    expect(notifyOnCloseMock).toHaveBeenCalledWith({
      name: "IMPORT",
      importData: {
        name: givenData.name,
        description: givenData.description,
        locale: givenData.locale,
        selectedFiles: givenData.selectedFiles,
      },
    });
  });

  it("should call notifyOnClose with IMPORT and the correct selected files when some files where removed by the user", async () => {
    // GIVEN the dialog is visible
    render(<ImportModelDialog {...testProps} />);
    // WHEN the user enters all the data required for the import
    // @ts-ignore
    const givenData = getImportDataTestValues();
    await fillInImportDialog(givenData);

    // AND the user removes one of the files
    const givenFileTypeToRemove = ImportAPISpecs.Constants.ImportFileTypes.ESCO_SKILL_GROUP;

    const fileEntries = screen.getAllByTestId(FILE_ENTRY_DATA_TEST_ID.FILE_ENTRY);

    let removedFile: boolean = false;
    for (const element of fileEntries) {
      if (element.getAttribute("data-filetype") === givenFileTypeToRemove) {
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
    await userEvent.click(importButton);

    // THEN the notifyOnClose is called with event name IMPORT and the data the user entered except the removed file
    const expectedFiles = givenData.selectedFiles;
    if (expectedFiles && givenFileTypeToRemove in expectedFiles) {
      delete expectedFiles[givenFileTypeToRemove];
    }

    expect(notifyOnCloseMock).toHaveBeenCalledWith({
      name: "IMPORT",
      importData: {
        name: givenData.name,
        description: givenData.description,
        locale: givenData.locale,
        selectedFiles: expectedFiles,
      },
    });
  });
});
