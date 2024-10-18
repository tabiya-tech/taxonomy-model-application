import * as React from "react";
import { ChangeEvent, useState } from "react";
import { Chip } from "@mui/material";
import debounce from "lodash.debounce";
import { DEBOUNCE_INTERVAL } from "./debouncing";
import { AddCircleOutlined, RemoveCircleOutlined } from "@mui/icons-material";
import parseSelectedModelInfoFile from "./parseSelectedModelInfoFile";
import { useSnackbar } from "src/theme/SnackbarProvider/SnackbarProvider";

export interface ModelInfoFileEntryProps {
  notifyUUIDHistoryChange?: (newUUIDHistory: string[]) => void;
  notifyOnDescriptionChange?: (description: string) => void;
}

const uniqueId = "16c54d56-b091-48ce-826a-c721b0c3643d";

export const DATA_TEST_ID = {
  FILE_ENTRY: `modelInfo-file-entry-${uniqueId}`,
  FILE_INPUT: `modelInfo-file-input-${uniqueId}`,
  SELECT_FILE_BUTTON: `modelInfo-select-file-button-${uniqueId}`,
  REMOVE_SELECTED_FILE_BUTTON: `modelInfo-remove-selected-file-button-${uniqueId}`,
};
export const modelInfoFileType = "MODEL_INFO";
export const modelInfoFileTypeName = "Model info";
/**
 * Represent a file entry of the model info type and a selected file
 * The data-filetype attribute is used to identify the file type
 * @constructor
 */

export const ModelInfoFileEntry = (props: Readonly<ModelInfoFileEntryProps>) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  const fileChangedHandler = async (e: ChangeEvent<HTMLInputElement>) => {
    const newFile: File = e.target?.files![0];
    if (newFile) {
      await updateSelectedFile(newFile);
    }
  };

  const fileRemovedHandler = async () => {
    await updateSelectedFile(null);
  };

  const notifyOnModelInfoChanges = (details: Awaited<ReturnType<typeof parseSelectedModelInfoFile>>) => {
    if (props.notifyUUIDHistoryChange) {
      props.notifyUUIDHistoryChange(details.UUIDHistory);
    }

    if (props.notifyOnDescriptionChange) {
      props.notifyOnDescriptionChange(details.description);
    }
  };

  const updateSelectedFile = async (file: File | null) => {
    setSelectedFile(file); // update internal state
    // notify the parent component if it has provided handler
    if (file) {
      try {
        const modelInfoDetails = await parseSelectedModelInfoFile(file);
        notifyOnModelInfoChanges(modelInfoDetails);
      } catch (e) {
        notifyOnModelInfoChanges({
          UUIDHistory: [],
          description: "",
        });

        console.error(e);
        enqueueSnackbar(`Error parsing file: ${file.name}. Please review the file and try again.`, {
          variant: "error",
        });
        setSelectedFile(null);
      }
    } else {
      notifyOnModelInfoChanges({
        UUIDHistory: [],
        description: "",
      });
    }
  };

  const debounceFileRemoveHandler = debounce(fileRemovedHandler, DEBOUNCE_INTERVAL);

  return (
    <div data-filetype={modelInfoFileType} data-testid={DATA_TEST_ID.FILE_ENTRY}>
      {selectedFile ? (
        <Chip
          color="secondary"
          aria-label={`Remove modelInfo csv file`}
          data-testid={DATA_TEST_ID.REMOVE_SELECTED_FILE_BUTTON}
          onClick={debounceFileRemoveHandler}
          icon={<RemoveCircleOutlined />}
          label={`${modelInfoFileTypeName}: ${selectedFile.name}`}
        />
      ) : (
        <div>
          <input
            id={`${uniqueId}-model-info`}
            type="file"
            style={{ display: "none" }}
            accept=".csv"
            data-testid={DATA_TEST_ID.FILE_INPUT}
            onChange={fileChangedHandler}
            data-filetype={modelInfoFileType}
          />
          <Chip
            color="primary"
            aria-label={`Add ${modelInfoFileType} csv file`}
            data-testid={DATA_TEST_ID.SELECT_FILE_BUTTON}
            onClick={() => document.getElementById(`${uniqueId}-model-info`)!.click()}
            icon={<AddCircleOutlined />}
            label={modelInfoFileTypeName}
          />
        </div>
      )}
    </div>
  );
};
export default ModelInfoFileEntry;
