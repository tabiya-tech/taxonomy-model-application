jest.mock("./FileEntry", () => {
  const mFileEntry = () => (<div data-testid="mock-file-entry">Mock FileEntry</div>);
  return {
    __esModule: true,
    default: mFileEntry,
  };
});

import {render, screen} from "@testing-library/react";
import {ImportFileTypes} from "api-specifications/import";
import ImportFilesSelection from "./ImportFilesSelection";

describe("Import Files Selection Tests", () => {
  it("should render default state", () => {
    // WHEN the import files selection is rendered
    const spyOnFileEntry = jest.spyOn(require("./FileEntry"), "default");
    render(<ImportFilesSelection/>);

    // THEN expect file entries for the all the ImportFileTypes  to be rendered
    const fileEntries = screen.getAllByTestId("mock-file-entry");
    expect(fileEntries.length).toBe(Object.values(ImportFileTypes).length);

    // AND expect the file entries to be rendered with the correct file types
    Object.values(ImportFileTypes).forEach((fileType, index) => {
      expect(spyOnFileEntry).toHaveBeenCalledWith({
        fileType: ImportFileTypes.ESCO_SKILL,
        notifySelectedFileChange: undefined
      }, {});
    });
  });

  it("should get notification from the file entries", () => {
    // GIVEN a notifySelectedFileChange mock
    const givenNotifySelectedFileChangeMock = jest.fn();

    // WHEN  the import files selection is rendered
    const spyOnFileEntry = jest.spyOn(require("./FileEntry"), "default");
    render(<ImportFilesSelection notifySelectedFileChange={givenNotifySelectedFileChangeMock}/>);

    // THEN expect the the given notifySelectedFileChange mock to have been passed to the file entries components
    Object.values(ImportFileTypes).forEach((fileType, index) => {
      expect(spyOnFileEntry).toHaveBeenCalledWith({
        fileType: ImportFileTypes.ESCO_SKILL,
        notifySelectedFileChange: givenNotifySelectedFileChangeMock
      }, {});
    });
  });
})