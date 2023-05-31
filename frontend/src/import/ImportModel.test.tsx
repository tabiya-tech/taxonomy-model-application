// ##############################
// Setup import.service mock
// ##############################
import {fireEvent, render, screen} from "src/_test_utilities/test-utils";
import ImportModel, {DATA_TEST_ID, HTML_ELEMENT_IDS} from "./ImportModel";
import {getTestString} from "src/_test_utilities/specialCharacters";
import {ILocale} from "api-specifications/modelInfo"
import userEvent from '@testing-library/user-event'
import ImportDirectorService from "./importDirector.service";
import {ImportFileTypes} from "api-specifications/import";

jest.mock("./importDirector.service", () => {
  const getMockId = require("src/_test_utilities/mockMongoId").getMockId;
  // Mocking the ES5 class
  const mockDirectorService = jest.fn(); // the constructor
  mockDirectorService.prototype.directImport = jest.fn().mockResolvedValue(getMockId(1));// adding a mock method
  return mockDirectorService;
});

describe("ImportModel dialog render tests", () => {
  it("should render import modal", () => {
    render(<ImportModel/>);
    const modalElement = screen.getByTestId(DATA_TEST_ID.DIALOG_ROOT);
    expect(modalElement).toBeInTheDocument();
  });

  it.skip("should render the name input field", () => {
    //GIVEN the dialog is visible
    render(<ImportModel/>);
    const nameInputElement = screen.getByTestId(DATA_TEST_ID.NAME_INPUT);

    //THEN expect nameInput to exist
    expect(nameInputElement).toBeInTheDocument();
  });

  it.skip("should render the description field", () => {
    //GIVEN the dialog is visible
    render(<ImportModel/>);
    const descInputElement = screen.getByTestId(DATA_TEST_ID.DESC_INPUT);

    //THEN expect description field to exist
    expect(descInputElement).toBeInTheDocument();
  });

  it("should render the import button", () => {
    //GIVEN the dialog is visible
    render(<ImportModel/>);
    const importButton = screen.getByTestId(DATA_TEST_ID.IMPORT_BUTTON);

    //THEN expect button to exist
    expect(importButton).toBeInTheDocument();
  });
});

describe.skip("ImportModel dialog action tests", () => {
  it("should be able to type into the name input", () => {
    // GIVEN some text
    const givenText = getTestString(256);
    // AND dialog is visible
    render(<ImportModel/>);

    // WHEN the user enters that into the input element
    const nameInputElement = screen.getByTestId(DATA_TEST_ID.NAME_INPUT);
    fireEvent.change(nameInputElement, {target: {value: givenText}});

    // THEN expect the value of the input field equal to the given text
    // @ts-ignore
    expect(nameInputElement.value).toBe(givenText);
  });

  it("should be able to type into the description input", () => {
    // GIVEN some text
    const givenText = getTestString(256);
    // AND dialog is visible
    render(<ImportModel/>);

    // WHEN the user enters that into the description element
    const descriptionInputElement = screen.getByTestId(DATA_TEST_ID.DESC_INPUT);
    fireEvent.change(descriptionInputElement, {target: {value: givenText}});

    // THEN expect the value of the input field equal to the given text
    // @ts-ignore
    expect(descriptionInputElement.value).toBe(givenText);
  });

  it.skip("import button should correctly import a model", async () => {
    // GIVEN dialog is visible
    const importDirectorService = new ImportDirectorService("/path/to/api");

    // AND the users has entered a name
    render(<ImportModel/>);
    const givenName = getTestString(1);
    const nameInputElement = screen.getByTestId(DATA_TEST_ID.NAME_INPUT);
    fireEvent.change(nameInputElement, {target: {value: givenName}});

    // AND a description
    const givenDescription = getTestString(1);
    const descriptionInputElement = screen.getByTestId(DATA_TEST_ID.DESC_INPUT);
    fireEvent.change(descriptionInputElement, {target: {value: givenDescription}});

    // AND a locale
    const givenDemoLocale: ILocale = {
      name: "South Africa",
      shortCode: "ZA",
      UUID: "8e763c32-4c21-449c-94ee-7ddeb379369a"
    };

    // AND a file
    const givenFile: File[] = [
      new File([getTestString(20)], 'file1.csv', {type: 'text/csv'})
    ];
    //TODO: user.upload

    // WHEN pressing the import button
    const importButton = screen.getByTestId(DATA_TEST_ID.IMPORT_BUTTON);
    fireEvent.click(importButton);

    // THEN expected to call the createModel function with the given values from the input fields
    expect(importDirectorService.directImport).toHaveBeenCalledWith(
      givenName,
      givenDescription,
      givenDemoLocale,
      givenFile
    );
  });
});

describe("File chooser test cases only", () => {
  it.skip("Should render file chooser", () => {
    //GIVEN the dialog is rendered,
    render(<ImportModel/>)
    const FILE_SELECTOR_PARENT = screen.getByTestId(DATA_TEST_ID.FILE_SELECTOR_PARENT);
    //THEN expect the file chooser to be available
    expect(FILE_SELECTOR_PARENT).toBeInTheDocument();
  })
})

describe.skip("File chooser action tests", () => {
  const files: { fileType: ImportFileTypes,file: File }[] = [
    {
        fileType: ImportFileTypes.ESCO_SKILL, file: new File([getTestString(20)], 'file1.csv', {type: 'text/csv'})
    },
    {
        fileType: ImportFileTypes.ESCO_OCCUPATION, file: new File([getTestString(20)], 'file2.csv', {type: 'text/csv'})
    }]

  it("'FILE_SELECTOR_FLAG_LABEL' should be visible when no file is selected", () => {
    //WHEN the import model is rendered
    render(<ImportModel/>)
    //GIVEN the prompt label
    const FILE_CHOOSER_FLAG_LABEL = screen.getByTestId(DATA_TEST_ID.FILE_SELECTOR_PLACEHOLDER_LABEL);
    //THEN expect FILE_CHOOSER_FLAG_LABEL to be in the document
    expect(FILE_CHOOSER_FLAG_LABEL).toBeInTheDocument();
  })

  it("'FILE_SELECTOR_FLAG_LABEL' should not be visible when file is selected", () => {
    //WHEN the import model is rendered
    render(<ImportModel/>)
    //GIVEN the FILE_SELECTOR_INPUT and FILE_SELECTOR_FLAG_LABEL
    const FILE_SELECTOR_INPUT = screen.getByTestId(DATA_TEST_ID.FILE_SELECTOR_INPUT);
    const FILE_SELECTOR_FLAG_LABEL = screen.getByTestId(DATA_TEST_ID.FILE_SELECTOR_PLACEHOLDER_LABEL);
    //WHEN the FILE_SELECTOR_INPUT onChange is triggered with loaded files
    fireEvent.change(FILE_SELECTOR_INPUT, {
      target: {
        files
      }
    })
    //THEN expect FILE_CHOOSER_FLAG_LABEL to be in the document
    expect(FILE_SELECTOR_FLAG_LABEL).not.toBeInTheDocument();
  })

  it("should have all selected files", async () => {
    //GIVEN the dialog is rendered,
    render(<ImportModel/>)
    //GIVEN the FILE_SELECTOR_INPUT
    const FILE_SELECTOR_INPUT: HTMLInputElement = screen.getByTestId<HTMLInputElement>(DATA_TEST_ID.FILE_SELECTOR_INPUT);
    expect(FILE_SELECTOR_INPUT).toBeDefined()
    //WHEN the FILE_SELECTOR_INPUT onChange is triggered with loaded files
    await userEvent.upload(FILE_SELECTOR_INPUT, files.map(file => file.file))

    expect(FILE_SELECTOR_INPUT.files!.length).toBe(files.length)
  })

  it("should have a link between file input label and file input element", async () => {
    //GIVEN the dialog is rendered,
    render(<ImportModel/>)
    const fileInputID = HTML_ELEMENT_IDS.FILE_SELECTOR_INPUT;
    //GIVEN the FILE_SELECTOR_INPUT
    const FILE_SELECTOR_INPUT: HTMLInputElement = screen.getByTestId<HTMLInputElement>(DATA_TEST_ID.FILE_SELECTOR_INPUT);
    const FILE_SELECTOR_FLAG_LABEL: HTMLLabelElement = screen.getByTestId<HTMLLabelElement>(DATA_TEST_ID.FILE_SELECTOR_PLACEHOLDER_LABEL);
    //THEN expect input to have the correct id
    expect(FILE_SELECTOR_INPUT.id).toBe(fileInputID)
    //THEN expect label for input
    expect(FILE_SELECTOR_FLAG_LABEL.htmlFor).toBe(fileInputID)
  })
})
