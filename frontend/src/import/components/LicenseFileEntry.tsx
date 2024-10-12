import React, { ChangeEvent, useState } from "react";
import { Chip } from "@mui/material";
import debounce from "lodash.debounce";
import { DEBOUNCE_INTERVAL } from "./debouncing";
import { AddCircleOutlined, RemoveCircleOutlined } from "@mui/icons-material";
import { useSnackbar } from "src/theme/SnackbarProvider/SnackbarProvider";

export interface LicenseFileEntryProps {
  notifyOnLicenseChange?: (license: string) => void;
}

const uniqueId = "16c54d56-b091-48ce-826a-c721b0c3643f";

export const DATA_TEST_ID = {
  FILE_ENTRY: `license-file-entry-${uniqueId}`,
  FILE_INPUT: `license-file-input-${uniqueId}`,
  SELECT_FILE_BUTTON: `license-select-file-button-${uniqueId}`,
  REMOVE_SELECTED_FILE_BUTTON: `license-remove-selected-file-button-${uniqueId}`,
};
export const licenseFileType = "LICENSE";
export const licenseFileTypeName = "LICENSE";

/**
 * Represent a file entry of the license type and a selected file
 * The data-filetype attribute is used to identify the file type
 * @constructor
 */

export const LicenseFileEntry = (props: Readonly<LicenseFileEntryProps>) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  const fileChangedHandler = async (e: ChangeEvent<HTMLInputElement>) => {
    const newFile: File = e.target?.files![0];
    // if some file is available, update the selected file
    await updateSelectedFile(newFile);
  };

  const fileRemovedHandler = async () => {
    await updateSelectedFile(null);
  };

  const updateSelectedFile = async (file: File | null) => {
    setSelectedFile(file); // update the selected file

    try {
      // notify the parent component if it has provided handler
      const fileContent = file ? await file.text() : "";

      if (props.notifyOnLicenseChange && fileContent && file) {
        props.notifyOnLicenseChange(fileContent);
      } else if (props.notifyOnLicenseChange) {
        props.notifyOnLicenseChange("");
      }
    } catch (e) {
      console.error(e);
      enqueueSnackbar(`Error parsing file: ${licenseFileTypeName}. Please review the file and try again.`, {
        variant: "error",
      });
    }
  };

  const debounceFileRemoveHandler = debounce(fileRemovedHandler, DEBOUNCE_INTERVAL);

  return (
    <div data-filetype={licenseFileType} data-testid={DATA_TEST_ID.FILE_ENTRY}>
      {selectedFile ? (
        <Chip
          color="secondary"
          aria-label={`Remove license file`}
          data-testid={DATA_TEST_ID.REMOVE_SELECTED_FILE_BUTTON}
          onClick={debounceFileRemoveHandler}
          icon={<RemoveCircleOutlined />}
          label={`${licenseFileTypeName}: ${selectedFile.name}`}
        />
      ) : (
        <div>
          <input
            id={`${uniqueId}-license`}
            type="file"
            style={{ display: "none" }}
            accept="*"
            data-testid={DATA_TEST_ID.FILE_INPUT}
            onChange={fileChangedHandler}
            data-filetype={licenseFileType}
          />
          <Chip
            color="primary"
            aria-label={`Add ${licenseFileType} file`}
            data-testid={DATA_TEST_ID.SELECT_FILE_BUTTON}
            onClick={() => {
              document.getElementById(`${uniqueId}-license`)!.click()
            }}
            icon={<AddCircleOutlined />}
            label={licenseFileTypeName}
          />
        </div>
      )}
    </div>
  );
};
export default LicenseFileEntry;
