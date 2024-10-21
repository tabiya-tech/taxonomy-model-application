// mute the console
import "src/_test_utilities/consoleMock";

import { useSnackbar } from "src/theme/SnackbarProvider/SnackbarProvider";
import { clickDebouncedButton } from "src/_test_utilities/userEventFakeTimer";
import { fireEvent, render, screen, waitFor } from "src/_test_utilities/test-utils";
import LicenseFileEntry, { DATA_TEST_ID, licenseFileType, licenseFileTypeName } from "./LicenseFileEntry";

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

describe("LicenseFileEntry render tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Should render the licenseFileEntry component", () => {
    // When LicenseFileEntry is rendered
    render(<LicenseFileEntry />);

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
    expect(fileInput).toHaveAttribute("data-filetype", licenseFileType);

    // AND expect file trigger fab to be in the document
    const selectFileButton = screen.getByTestId(DATA_TEST_ID.SELECT_FILE_BUTTON);
    expect(selectFileButton).toBeInTheDocument();

    // AND expect file remover fab to not be in the document
    const fileRemoverButton = screen.queryByTestId(DATA_TEST_ID.REMOVE_SELECTED_FILE_BUTTON);
    expect(fileRemoverButton).not.toBeInTheDocument();

    // AND expect the SELECT_FILE_BUTTON to have the correct file type name
    expect(selectFileButton.textContent).toBe(licenseFileTypeName);
  });
});

describe("LicenseFileEntry action tests", () => {
  it("should select file", async () => {
    // GIVEN some file
    const givenFile = new File([], licenseFileTypeName, { type: "txt" });
    givenFile.text = jest.fn().mockResolvedValue("foo license");

    // When LicenseFileEntry is rendered
    render(<LicenseFileEntry />);
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

    const givenFile = new File([], licenseFileTypeName);
    givenFile.text = jest.fn().mockResolvedValue("foo license");

    // When LicenseFileEntry is rendered
    render(<LicenseFileEntry />);

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
    const givenLicense = "foo license";
    const givenFile = new File([], licenseFileTypeName);
    givenFile.text = jest.fn().mockResolvedValue(givenLicense);

    // AND a notification handler
    const givenMockNotification = jest.fn();

    // When LicenseFileEntry is rendered
    render(<LicenseFileEntry notifyOnLicenseChange={givenMockNotification} />);
    // AND a file is chosen
    const fileInput = screen.getByTestId(DATA_TEST_ID.FILE_INPUT);
    fireEvent.change(fileInput, { target: { files: [givenFile] } });

    // THEN expect the notification handler to have been called with the given filetype and file
    await waitFor(() => {
      expect(givenMockNotification).toHaveBeenCalledWith(givenLicense);
    });
  });

  it("should correctly notify the notifyOnLicenseChange handler when file is removed", async () => {
    // GIVEN some file
    const givenLicenseContent = "foo license";
    const givenFile = new File([new Blob(["foo bar "])], licenseFileTypeName);
    File.prototype.text = jest.fn().mockResolvedValue(givenLicenseContent);

    // AND a notification handler
    const givenMockNotification = jest.fn();

    // When LicenseFileEntry is rendered
    render(<LicenseFileEntry notifyOnLicenseChange={givenMockNotification} />);
    // AND the given file has been selected

    let fileInput: HTMLInputElement = screen.getByTestId(DATA_TEST_ID.FILE_INPUT);
    fireEvent.change(fileInput, { target: { files: [givenFile] } });

    expect(fileInput.files).toHaveLength(1);

    // THEN expect notificationHandler to have been called with givenFileType and null,
    await waitFor(() => {
      expect(givenMockNotification).toHaveBeenNthCalledWith(1, givenLicenseContent);
    });

    // WHEN the file is removed.
    // AND the remove selected file button is clicked
    const fileRemoverFab = screen.getByTestId(DATA_TEST_ID.REMOVE_SELECTED_FILE_BUTTON);

    // wait for the component's state to update
    await clickDebouncedButton(fileRemoverFab);

    // THEN expect notificationHandler to have been called with givenFileType and null,
    await waitFor(() => {
      expect(givenMockNotification).toHaveBeenNthCalledWith(2, "");
    });
  });

  it("should handle file changes even if notifyUUIDHistoryChange handler is not set", async () => {
    // GIVEN some file
    const givenLicenseContent = "foo license";
    const givenAFile = new File([], licenseFileTypeName);
    File.prototype.text = jest.fn().mockResolvedValue(givenLicenseContent);

    // When LicenseFileEntry is rendered without a notification handler
    render(<LicenseFileEntry />);
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
    const givenLicenseContent = "foo license";
    const givenFile = new File([], licenseFileTypeName);
    File.prototype.text = jest.fn().mockResolvedValue(givenLicenseContent);

    // AND a notification handler
    const givenMockNotification = jest.fn();

    // AND file parsing throws an error
    const givenError = "Error parsing file";
    givenFile.text = jest.fn().mockRejectedValue("Error parsing file");

    // WHEN LicenseFileEntry is rendered
    render(<LicenseFileEntry notifyOnLicenseChange={givenMockNotification} />);

    // AND a file is chosen
    const fileInput = screen.getByTestId(DATA_TEST_ID.FILE_INPUT);
    fireEvent.change(fileInput, { target: { files: [givenFile] } });

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

  it("should open the file input when the select file button is clicked", async () => {
    // GIVEN the component is rendered  with a notification handler
    const givenMockNotification = jest.fn();
    render(<LicenseFileEntry notifyOnLicenseChange={givenMockNotification} />);

    // AND We have a file input in the content
    const fileInput = screen.getByTestId(DATA_TEST_ID.FILE_INPUT);
    const fileInputClickSpy = jest.spyOn(fileInput, "click"); // Spy on the click method

    // WHEN the select file button is clicked
    const selectFileButton = screen.getByTestId(DATA_TEST_ID.SELECT_FILE_BUTTON);
    fireEvent.click(selectFileButton);

    // THEN the file input should be clicked
    expect(fileInputClickSpy).toHaveBeenCalled();
  });
});
