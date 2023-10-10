import * as React from "react";
import { ChangeEvent, useState } from "react";
import ImportAPISpecs from "api-specifications/import";
import { Chip, ChipProps } from "@mui/material";
import { generateUniqueId } from "src/utils/generateUniqueId";
import { mapFileTypeToName } from "./mapFileTypeToName";
import debounce from "lodash.debounce";
import { DEBOUNCE_INTERVAL } from "./debouncing";
import { AddCircleOutlined, RemoveCircleOutlined } from "@mui/icons-material";

export interface FileEntryProps {
  fileType: ImportAPISpecs.Constants.ImportFileTypes;
  notifySelectedFileChange?: (fileType: ImportAPISpecs.Constants.ImportFileTypes, newFile: File | null) => void;
}

const baseTestID = "d2bc4d5d-7760-450d-bac6-a8857affeb89";

export const DATA_TEST_ID = {
  FILE_ENTRY: `file-entry-${baseTestID}`,
  FILE_INPUT: `file-input-${baseTestID}`,
  SELECT_FILE_BUTTON: `select-file-button-${baseTestID}`,
  REMOVE_SELECTED_FILE_BUTTON: `remove-selected-file-button-${baseTestID}`,
};

/**
 * Represent a file entry of specific type and a selected file
 * The data-filetype attribute is used to identify the file type
 * @constructor
 */

export const FileEntry = (props: Readonly<FileEntryProps>) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const uniqueId: string = generateUniqueId(); // unique id for the input element to ensure the onClick will find the correct element across all entries in the dom
  const fileTypeName = mapFileTypeToName(props.fileType);
  const fileChangedHandler = (e: ChangeEvent<HTMLInputElement>) => {
    const newFile: File = e.target?.files![0];
    if (newFile) {
      updateSelectedFile(newFile);
    }
  };

  const fileRemovedHandler = () => {
    updateSelectedFile(null);
  };

  const updateSelectedFile = (file: File | null) => {
    setSelectedFile(file); // update internal state
    // notify the parent component if it has provided handler
    if (props.notifySelectedFileChange) {
      props.notifySelectedFileChange(props.fileType, file);
    }
  };

  const debounceFileRemoveHandler = debounce(fileRemovedHandler, DEBOUNCE_INTERVAL);

  return (
    <div data-filetype={props.fileType} data-testid={DATA_TEST_ID.FILE_ENTRY}>
      {selectedFile ? (
        <Chip
          {...commonChipProps}
          {...selectedFileChipProps}
          color="secondary"
          aria-label={`Remove ${fileTypeName} csv file`}
          data-testid={DATA_TEST_ID.REMOVE_SELECTED_FILE_BUTTON}
          onClick={debounceFileRemoveHandler}
          icon={<RemoveCircleOutlined />}
          label={`${fileTypeName}: ${selectedFile.name}`}
        />
      ) : (
        <div>
          <input
            id={uniqueId}
            type="file"
            style={{ display: "none" }}
            accept=".csv"
            data-testid={DATA_TEST_ID.FILE_INPUT}
            onChange={fileChangedHandler}
            data-filetype={props.fileType}
          />
          <Chip
            {...commonChipProps}
            color="primary"
            aria-label={`Add ${fileTypeName} csv file`}
            data-testid={DATA_TEST_ID.SELECT_FILE_BUTTON}
            onClick={() => document.getElementById(uniqueId)!.click()}
            icon={<AddCircleOutlined />}
            label={fileTypeName}
          />
        </div>
      )}
    </div>
  );
};
export default FileEntry;

const commonChipProps = {
  size: "medium" as ChipProps["size"],
  component: "span",
  sx: { textTransform: "none" }, // Add any other shared styles here
};
const selectedFileChipProps = {
  sx: {
    textTransform: "none",
    justifyContent: "flex-start",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    width: "250px",
  },
};
