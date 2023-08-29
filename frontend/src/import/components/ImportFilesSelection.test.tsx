jest.mock("./FileEntry", () => {
  const mFileEntry = () => (<div data-testid="mock-file-entry">Mock FileEntry</div>);
  return {
    __esModule: true,
    default: mFileEntry,
  };
});

import {render, screen} from "src/_test_utilities/test-utils";
import {Constants as ImportConstants} from "api-specifications/import";
import ImportFilesSelection, {DATA_TEST_ID} from "./ImportFilesSelection";
import React from "react";

describe("ImportFilesSelection render tests", () => {
  test("should render default state", () => {
    // WHEN the import files selection is rendered
    const spyOnFileEntry = jest.spyOn(require("./FileEntry"), "default");
    render(<ImportFilesSelection/>);

    // THEN expect the import files selection to be visible
    const importFilesSelection = screen.getByTestId(DATA_TEST_ID.IMPORT_FILES_SELECTION);
    expect(importFilesSelection).toBeInTheDocument();


    // AND expect file entries for the all the ImportFileTypes  to be rendered
    const fileEntries = screen.getAllByTestId("mock-file-entry");
    expect(fileEntries.length).toBe(Object.values(ImportConstants.ImportFileTypes).length);

    // AND expect the file entries to be rendered with the correct file types
    Object.values(ImportConstants.ImportFileTypes).forEach((fileType) => {
      expect(spyOnFileEntry).toHaveBeenCalledWith({
        fileType: fileType,
        notifySelectedFileChange: undefined
      }, {});
    });
  });
})

describe("ImportFilesSelection action tests", () => {
  test("should get notification from the file entries", () => {
    // GIVEN a notifySelectedFileChange mock
    const givenNotifySelectedFileChangeMock = jest.fn();

    // WHEN  the import files selection is rendered
    const spyOnFileEntry = jest.spyOn(require("./FileEntry"), "default");
    render(<ImportFilesSelection notifySelectedFileChange={givenNotifySelectedFileChangeMock}/>);

    // THEN expect that the given notifySelectedFileChange mock to have been passed to the file entries components
    Object.values(ImportConstants.ImportFileTypes).forEach((fileType) => {
      expect(spyOnFileEntry).toHaveBeenCalledWith({
        fileType: fileType,
        notifySelectedFileChange: givenNotifySelectedFileChangeMock
      }, {});
    });
  });
})