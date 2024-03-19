// mute the console
import "src/_test_utilities/consoleMock";

import { fireEvent, render, screen, waitFor } from "src/_test_utilities/test-utils";
import { clickDebouncedButton } from "src/_test_utilities/userEventFakeTimer";
import ModelInfoFileEntry, { DATA_TEST_ID, modelInfoFileType, modelInfoFileTypeName } from "./ModelInfoFileEntry";
import parseSelectedModelInfoFile from "./parseSelectedModelInfoFile";
import { useSnackbar } from "src/theme/SnackbarProvider/SnackbarProvider";

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

describe("ModelInfoFileEntry render tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Should render the modelInfoFileEntry component", () => {
    // When ModelInfoFileEntry is rendered
    render(<ModelInfoFileEntry />);

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND the component to be rendered
    const fileEntry = screen.getByTestId(DATA_TEST_ID.FILE_ENTRY);
    expect(fileEntry).toBeInTheDocument();
    expect(fileEntry).toMatchSnapshot();
    // AND to have the correct file type
    expect(fileEntry).toHaveAttribute("data-filetype");

    // AND expect file input's to have no files
    const fileInput: HTMLInputElement = screen.getByTestId(DATA_TEST_ID.FILE_INPUT);
    expect(fileInput.files).toHaveLength(0);
    // AND expect file input to have the file type
    expect(fileInput).toHaveAttribute("data-filetype", modelInfoFileType);

    // AND expect file trigger fab to be in the document
    const selectFileButton = screen.getByTestId(DATA_TEST_ID.SELECT_FILE_BUTTON);
    expect(selectFileButton).toBeInTheDocument();

    // AND expect file remover fab to not be in the document
    const fileRemoverButton = screen.queryByTestId(DATA_TEST_ID.REMOVE_SELECTED_FILE_BUTTON);
    expect(fileRemoverButton).not.toBeInTheDocument();

    // AND expect the SELECT_FILE_BUTTON to have the correct file type name
    expect(selectFileButton.textContent).toBe(modelInfoFileTypeName);
  });
});

describe("ModelInfoFileEntry action tests", () => {
  it("should selected file", async () => {
    // GIVEN some file
    const givenFile = new File([], "foo.csv", { type: "text/csv" });

    // When ModelInfoFileEntry is rendered
    render(<ModelInfoFileEntry />);
    // AND fileInput value is changed
    const fileInput: HTMLInputElement = screen.getByTestId(DATA_TEST_ID.FILE_INPUT);
    fireEvent.change(fileInput, { target: { files: [givenFile] } });

    // THEN expect file input to have 1 file
    expect(fileInput.files).toHaveLength(1);

    // AND expect file trigger fab to not be in the document
    const selectFileButton = screen.queryByTestId(DATA_TEST_ID.SELECT_FILE_BUTTON);
    expect(selectFileButton).not.toBeInTheDocument();

    // AND expect file remover fab to be in the document
    const fileRemoverFab = screen.queryByTestId(DATA_TEST_ID.REMOVE_SELECTED_FILE_BUTTON);
    expect(fileRemoverFab).toBeInTheDocument();
  });

  it("should remove selected file", async () => {
    // GIVEN some file
    const givenFile = new File([], "foo.csv", { type: "text/csv" });
    // When ModelInfoFileEntry is rendered
    render(<ModelInfoFileEntry />);
    // AND fileInput value has changed
    let fileInput: HTMLInputElement = screen.getByTestId(DATA_TEST_ID.FILE_INPUT);
    fireEvent.change(fileInput, { target: { files: [givenFile] } });
    expect(fileInput.files).toHaveLength(1);

    // WHEN fileRemoverFab is clicked
    const fileRemoverFab = screen.getByTestId(DATA_TEST_ID.REMOVE_SELECTED_FILE_BUTTON);
    await clickDebouncedButton(fileRemoverFab);

    // THEN expect file input to have an empty files
    // wait for the component's state to update
    await waitFor(() => {
      fileInput = screen.getByTestId(DATA_TEST_ID.FILE_INPUT);
    }, {});
    expect(fileInput.files).toHaveLength(0);
    // AND expect file trigger fab to be in the document
    const selectFileButton = screen.getByTestId(DATA_TEST_ID.SELECT_FILE_BUTTON);
    expect(selectFileButton).toBeInTheDocument();
  });

  it("should correctly notify the notifyUUIDHistoryChange handler when file is selected", async () => {
    // GIVEN some file
    const givenFile = new File([], "foo.csv", { type: "text/csv" });
    // AND a notification handler
    const givenMockNotification = jest.fn();

    // When ModelInfoFileEntry is rendered
    const givenParsedUUIDHistory = ["uuid1", "uuid2"];
    jest
      .spyOn(require("./parseSelectedModelInfoFile"), "default")
      .mockImplementationOnce(() => Promise.resolve(givenParsedUUIDHistory));
    render(<ModelInfoFileEntry notifyUUIDHistoryChange={givenMockNotification} />);
    // AND a file is chosen
    const fileInput = screen.getByTestId(DATA_TEST_ID.FILE_INPUT);
    fireEvent.change(fileInput, { target: { files: [givenFile] } });
    // THEN expect the parseSelectedModelInfoFile to have been called with the given file
    await waitFor(() => {
      expect(parseSelectedModelInfoFile).toHaveBeenCalledWith(givenFile);
    });
    // THEN expect notification to have been called with the given filetype and file
    expect(givenMockNotification).toHaveBeenCalledWith(givenParsedUUIDHistory);
  });

  it("should correctly notify the notifyUUIDHistoryChange handler when file is removed", async () => {
    // GIVEN some file
    const givenFile = new File([], "foo.csv", { type: "text/csv" });
    // AND a notification handler
    const givenMockNotification = jest.fn();

    // When ModelInfoFileEntry is rendered
    jest.spyOn(require("./parseSelectedModelInfoFile"), "default").mockImplementationOnce(() => Promise.resolve([]));
    render(<ModelInfoFileEntry notifyUUIDHistoryChange={givenMockNotification} />);
    // AND the given file has been selected
    let fileInput: HTMLInputElement = screen.getByTestId(DATA_TEST_ID.FILE_INPUT);
    fireEvent.change(fileInput, { target: { files: [givenFile] } });
    expect(fileInput.files).toHaveLength(1);

    // WHEN the remove selected file button is clicked
    const fileRemoverFab = screen.getByTestId(DATA_TEST_ID.REMOVE_SELECTED_FILE_BUTTON);
    // wait for the component's state to update
    await clickDebouncedButton(fileRemoverFab);
    // THEN expect notificationHandler to have been called with givenFileType and null,
    expect(givenMockNotification).toHaveBeenLastCalledWith([]);
  });

  it("should handle file changes even if notifyUUIDHistoryChange handler is not set", async () => {
    // GIVEN some file
    const givenAFile = new File([], "foo.csv", { type: "text/csv" });

    // When ModelInfoFileEntry is rendered without a notification handler
    render(<ModelInfoFileEntry />);
    // AND fileInput value has changed
    let fileInput: HTMLInputElement = screen.getByTestId(DATA_TEST_ID.FILE_INPUT);
    fireEvent.change(fileInput, { target: { files: [givenAFile] } });

    // THEN expect file input to have 1 files
    expect(fileInput.files).toHaveLength(1);

    // AND expect the fileRemoverButton to be in the document
    const fileRemoverButton = screen.getByTestId(DATA_TEST_ID.REMOVE_SELECTED_FILE_BUTTON);
    expect(fileRemoverButton).toBeInTheDocument();
  });

  it("should show a snackbar when the file is not parsed correctly", async () => {
    // GIVEN some file
    const givenFile = new File([], "foo.csv", { type: "text/csv" });
    // AND a notification handler
    const givenMockNotification = jest.fn();
    // AND a parseSelectedModelInfoFile that throws an error
    const givenError = new Error("parse error");
    jest
      .spyOn(require("./parseSelectedModelInfoFile"), "default")
      .mockImplementationOnce(() => Promise.reject(givenError));

    // When ModelInfoFileEntry is rendered
    render(<ModelInfoFileEntry notifyUUIDHistoryChange={givenMockNotification} />);
    // AND a file is chosen
    const fileInput = screen.getByTestId(DATA_TEST_ID.FILE_INPUT);
    fireEvent.change(fileInput, { target: { files: [givenFile] } });
    // THEN expect the parseSelectedModelInfoFile to have been called with the given file
    expect(parseSelectedModelInfoFile).toHaveBeenCalledWith(givenFile);
    // THEN expect the notification handler not to have been called
    expect(givenMockNotification).not.toHaveBeenCalled();
    // AND expect the error to have been logged to the console
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(givenError);
    });
    // THEN expect a snackbar to have been shown
    const { enqueueSnackbar } = useSnackbar();
    expect(enqueueSnackbar).toHaveBeenCalledWith(
      `Error parsing file: ${givenFile.name}. Please review the file and try again.`,
      { variant: "error" }
    );
  });
});
