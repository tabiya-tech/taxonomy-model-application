import { FileEntryProps } from "./FileEntry";
import { ModelInfoFileEntry } from "src/import/components/ModelInfoFileEntry";

jest.mock("./FileEntry", () => {
  const mFileEntry = (props: FileEntryProps) => (
    <div data-testid="mock-file-entry">Mock FileEntry: {props.fileType} </div>
  );
  return {
    __esModule: true,
    default: mFileEntry,
  };
});

jest.mock("src/import/components/ModelInfoFileEntry");

// mute the console
import "src/_test_utilities/consoleMock";

import { render, screen } from "src/_test_utilities/test-utils";
import ImportAPISpecs from "api-specifications/import";
import ImportFilesSelection, { DATA_TEST_ID } from "./ImportFilesSelection";
import React from "react";
import { waitFor } from "@testing-library/react";

describe("ImportFilesSelection render tests", () => {
  beforeEach(() => {
    (console.error as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();
  });

  test("should render default state", () => {
    // WHEN the import files selection is rendered
    const spyOnFileEntry = jest.spyOn(require("./FileEntry"), "default");
    render(<ImportFilesSelection />);

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND the import files selection to be visible
    const importFilesSelection = screen.getByTestId(DATA_TEST_ID.IMPORT_FILES_SELECTION);
    expect(importFilesSelection).toBeInTheDocument();
    // AND to match the snapshot
    expect(importFilesSelection).toMatchSnapshot();

    // AND expect file entries for the all the ImportFileTypes  to be rendered
    const fileEntries = screen.getAllByTestId("mock-file-entry");
    expect(fileEntries.length).toBe(Object.values(ImportAPISpecs.Constants.ImportFileTypes).length);

    // AND expect the file entries to be rendered with the correct file types
    Object.values(ImportAPISpecs.Constants.ImportFileTypes).forEach((fileType) => {
      expect(spyOnFileEntry).toHaveBeenCalledWith(
        {
          fileType: fileType,
          notifySelectedFileChange: undefined,
        },
        {}
      );
    });
  });
});

describe("ImportFilesSelection action tests", () => {
  test("should get notification from the file entries", () => {
    // GIVEN a notifySelectedFileChange mock
    const givenNotifySelectedFileChangeMock = jest.fn();

    // WHEN  the import files selection is rendered
    const spyOnFileEntry = jest.spyOn(require("./FileEntry"), "default");
    render(<ImportFilesSelection notifySelectedFileChange={givenNotifySelectedFileChangeMock} />);

    // THEN expect that the given notifySelectedFileChange mock to have been passed to the file entries components
    Object.values(ImportAPISpecs.Constants.ImportFileTypes).forEach((fileType) => {
      expect(spyOnFileEntry).toHaveBeenCalledWith(
        {
          fileType: fileType,
          notifySelectedFileChange: givenNotifySelectedFileChangeMock,
        },
        {}
      );
    });
  });

  it("should send the same notification functions related to model info file entry", async () => {
    // GIVEN some notification functions
    const givenNotifyUUIDHistoryChangeMock = jest.fn();
    const givenNotifyOnDescriptionChangeMock = jest.fn();

    // WHEN the import files selection is rendered with the notification functions
    render(
      <ImportFilesSelection
        notifyUUIDHistoryChange={givenNotifyUUIDHistoryChangeMock}
        notifyOnDescriptionChange={givenNotifyOnDescriptionChangeMock}
      />
    );

    // THEN ModelInfoFileEntry should be rendered with the same notification functions
    await waitFor(() => {
      expect(ModelInfoFileEntry).toHaveBeenCalledWith(
        {
          notifyUUIDHistoryChange: givenNotifyUUIDHistoryChangeMock,
          notifyOnDescriptionChange: givenNotifyOnDescriptionChangeMock,
        },
        {}
      );
    });
  });
});
