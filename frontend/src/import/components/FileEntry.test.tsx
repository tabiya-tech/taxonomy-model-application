import {act, fireEvent, render, screen} from "src/_test_utilities/test-utils";
import {DATA_TEST_ID, FileEntry} from "./FileEntry";
import {ImportFileTypes} from "api-specifications/import";
import {mapFileTypeToName} from "./mapFileTypeToName";

describe("FileEntry tests only", () => {

  it.each(
    [...Object.values(ImportFileTypes).map((fileType) => [fileType as ImportFileTypes, mapFileTypeToName(fileType)] as [ImportFileTypes, string])]
  )
  ("should render default state %s -> %s", (fileType: ImportFileTypes, expectedFileTypeName: string) => {
    // WHEN fileEntry is rendered with some fileType
    render(<FileEntry fileType={fileType}/>)

    // THEN expect file input's to have no files
    const fileInput: HTMLInputElement = screen.getByTestId(DATA_TEST_ID.FILE_ENTRY_INPUT);
    expect(fileInput.files).toHaveLength(0);

    // AND expect file trigger fab to be in the document
    const selectFileButton = screen.getByTestId(DATA_TEST_ID.SELECT_FILE_BUTTON)
    expect(selectFileButton).toBeInTheDocument();

    // AND expect file remover fab to not be in the document
    const fileRemoverButton = screen.queryByTestId(DATA_TEST_ID.REMOVE_SELECTED_FILE_BUTTON)
    expect(fileRemoverButton).not.toBeInTheDocument();

    // AND expect the SELECT_FILE_BUTTON to have the correct file type name
    expect(selectFileButton.textContent).toBe(expectedFileTypeName);
  })

  it("should render file selected state", async () => {
    // GIVEN some fileType
    const givenFileType = ImportFileTypes.ESCO_OCCUPATION;
    // AND some file
    const givenAFile = new File([], "foo.csv", {type: "text/csv"})

    // WHEN fileEntry is rendered
    render(<FileEntry fileType={givenFileType}/>)
    // AND fileInput value is changed
    const fileInput: HTMLInputElement = screen.getByTestId(DATA_TEST_ID.FILE_ENTRY_INPUT);
    await act(() => fireEvent.change(fileInput, {target: {files: [givenAFile]}}));

    // THEN expect file input to have 1 files
    expect(fileInput.files).toHaveLength(1);

    // AND expect file trigger fab to not be in the document
    const selectFileButton = screen.queryByTestId(DATA_TEST_ID.SELECT_FILE_BUTTON)
    expect(selectFileButton).not.toBeInTheDocument();

    // AND expect file remover fab to be in the document
    const fileRemoverFab = screen.queryByTestId(DATA_TEST_ID.REMOVE_SELECTED_FILE_BUTTON)
    expect(fileRemoverFab).toBeInTheDocument();
  })

  it("should remove selected file", async () => {
    // GIVEN some fileType
    const givenFileType = ImportFileTypes.ESCO_OCCUPATION;
    // AND some file
    const givenAFile = new File([], "foo.csv", {type: "text/csv"})
    // AND fileEntry is rendered
    render(<FileEntry fileType={givenFileType}/>)
    // AND fileInput value has changed
    let fileInput: HTMLInputElement = screen.getByTestId(DATA_TEST_ID.FILE_ENTRY_INPUT);
    await act(() => fireEvent.change(fileInput, {target: {files: [givenAFile]}}));
    expect(fileInput.files).toHaveLength(1);

    // WHEN fileRemoverFab is clicked
    const fileRemoverFab = screen.getByTestId(DATA_TEST_ID.REMOVE_SELECTED_FILE_BUTTON)
    // wait for the component's state to update
    await act(() => fireEvent.click(fileRemoverFab));

    // THEN expect file input to have an empty files
    // get the new fileInput element from the dom
    fileInput = screen.getByTestId(DATA_TEST_ID.FILE_ENTRY_INPUT);
    expect(fileInput.files).toHaveLength(0);
    // AND expect file trigger fab to be in the document
    const selectFileButton = screen.getByTestId(DATA_TEST_ID.SELECT_FILE_BUTTON)
    expect(selectFileButton).toBeInTheDocument();
  })

  it("multiple components should have a unique id", () => {
    // GIVEN some filetype
    const givenFileType = ImportFileTypes.ESCO_OCCUPATION;

    // WHEN fileEntry is rendered multiples
    render(<FileEntry fileType={givenFileType}/>)
    render(<FileEntry fileType={givenFileType}/>)

    // THEN expect to find two inputEntries
    let inputEntries = screen.getAllByTestId(DATA_TEST_ID.FILE_ENTRY_INPUT)
    expect(inputEntries.length).toBe(2);

    // AND their ids are different
    expect(inputEntries[0].id).not.toBe(inputEntries[1].id);
  })

  it("should correctly notify the notifySelectedFileChange handler when file is selected", async () => {
    // GIVEN some fileType
    const givenFileType = ImportFileTypes.ESCO_OCCUPATION;
    // AND a notification handler
    const givenMockNotification = jest.fn();
    // AND some file
    const givenFile = new File([], "foo.csv", {type: "text/csv"})

    // WHEN fileEntry is rendered
    render(<FileEntry fileType={givenFileType} notifySelectedFileChange={givenMockNotification}/>);
    // AND a file is chosen
    const fileInput = screen.getByTestId(DATA_TEST_ID.FILE_ENTRY_INPUT);
    await act(() => fireEvent.change(fileInput, {target: {files: [givenFile]}}));

    // THEN expect notification to have been called with the given filetype and file
    expect(givenMockNotification).toHaveBeenCalledWith(givenFileType, givenFile);
  })

  it("should correctly notify the notifySelectedFileChange handler when file is removed", async () => {
    // GIVEN some fileType
    const givenFileType = ImportFileTypes.ESCO_OCCUPATION;
    // AND someNotificationHandler
    const givenMockNotification = jest.fn();
    // AND some file
    const givenAFile = new File([], "foo.csv", {type: "text/csv"})
    // AND fileEntry is rendered
    render(<FileEntry fileType={givenFileType} notifySelectedFileChange={givenMockNotification}/>)
    // AND the given file has been selected
    let fileInput: HTMLInputElement = screen.getByTestId(DATA_TEST_ID.FILE_ENTRY_INPUT);
    await act(() => fireEvent.change(fileInput, {target: {files: [givenAFile]}}));
    expect(fileInput.files).toHaveLength(1);

    // WHEN the remove selected file button is clicked
    const fileRemoverFab = screen.getByTestId(DATA_TEST_ID.REMOVE_SELECTED_FILE_BUTTON)
    // wait for the component's state to update
    await act(() => fireEvent.click(fileRemoverFab));

    // THEN expect notificationHandler to have been called with givenFileType and null
    expect(givenMockNotification).toBeCalledWith(givenFileType, null)
  });

  it("should handle file changes even if notifySelectedFileChange handler is not set", async () => {
    // GIVEN some fileType
    const givenFileType = ImportFileTypes.ESCO_OCCUPATION;
    // AND some file
    const givenAFile = new File([], "foo.csv", {type: "text/csv"})

    // When  fileEntry is rendered without a notification handler
    render(<FileEntry fileType={givenFileType}/>)
    // AND fileInput value has changed
    let fileInput: HTMLInputElement = screen.getByTestId(DATA_TEST_ID.FILE_ENTRY_INPUT);
    await act(() => fireEvent.change(fileInput, {target: {files: [givenAFile]}}));

    // THEN expect file input to have 1 files
    expect(fileInput.files).toHaveLength(1);

    // AND expect the fileRemoverButton to be in the document
    const fileRemoverButton = screen.getByTestId(DATA_TEST_ID.REMOVE_SELECTED_FILE_BUTTON)
    expect(fileRemoverButton).toBeInTheDocument();
  });
})