import * as React from "react";
import {ChangeEvent, useState} from "react";
import AddIcon from "@mui/icons-material/AddCircleOutline";
import RemoveIcon from "@mui/icons-material/RemoveCircleOutline";
import {ImportFileTypes} from "api-specifications/import";
import {Fab, FabProps} from "@mui/material";
import {generateUniqueId} from "src/utils/generateUniqueId";
import {mapFileTypeToName} from "./mapFileTypeToName";

export interface FileEntryProps {
  fileType: ImportFileTypes,
  notifySelectedFileChange?: (fileType: ImportFileTypes, newFile: File | null) => void
}

const baseTestID = "d2bc4d5d-7760-450d-bac6-a8857affeb89"

export const DATA_TEST_ID = {
  FILE_ENTRY_INPUT: `file-entry-input-${baseTestID}`,
  SELECT_FILE_BUTTON: `fab-load-file-trigger-${baseTestID}`,
  REMOVE_SELECTED_FILE_BUTTON: `fab-load-file-remover-${baseTestID}`
}

/**
 * Represent a file entry of specific type and a selected file
 * @param fileType
 * @param fileChangeHandler
 * @constructor
 */

export const FileEntry = ({fileType, notifySelectedFileChange}: FileEntryProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const uniqueId: string = generateUniqueId(); // unique id for the input element to ensure the onClick will find the correct element across all entries in the dom
  const fileTypeName = mapFileTypeToName(fileType);
  const fileChangedHandler = (e: ChangeEvent<HTMLInputElement>) => {
    const newFile: File = e.target?.files![0];
    if (newFile) {
      updateSelectedFile(newFile);
    }
  }

  const fileRemovedHandler = () => {
    updateSelectedFile(null);
  }

  const updateSelectedFile = (file: File | null) => {
    setSelectedFile(file); // update internal state
    // notify the parent component if it has provided handler
    if (notifySelectedFileChange) {
      notifySelectedFileChange(fileType, file);
    }
  }

  return <div>
    {
      selectedFile ?
        <Fab {...commonFabProps} {...selectedFileFabProps} color='secondary'
             aria-label={`Remove ${fileTypeName} csv file`}
             data-testid={DATA_TEST_ID.REMOVE_SELECTED_FILE_BUTTON}
             onClick={fileRemovedHandler}>
          <RemoveIcon/>
          <span style={{
            display: 'inline-block',
            maxWidth: 'calc(100% - 20px)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>{fileTypeName}: {selectedFile.name}</span>
        </Fab>
        : <div>
          <input id={uniqueId} type='file' style={{display: 'none'}} datatype='.csv'
                 data-testid={DATA_TEST_ID.FILE_ENTRY_INPUT}
                 onChange={fileChangedHandler}/>
          <Fab {...commonFabProps} color='primary'
               aria-label={`Add ${fileTypeName} csv file`}
               data-testid={DATA_TEST_ID.SELECT_FILE_BUTTON}
               onClick={() => document.getElementById(uniqueId)!.click()}>
            <AddIcon/>{fileTypeName}
          </Fab>
        </div>
    }
  </div>
}
export default FileEntry;

const commonFabProps = {
  size: "small" as FabProps['size'],
  component: "span",
  variant: "extended" as FabProps['variant'],
  sx: {textTransform: 'none'},
  // Add any other shared styles here
};
const selectedFileFabProps = {
  sx: {
    textTransform: 'none',
    justifyContent: 'flex-start',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    width: '250px'
  }
}