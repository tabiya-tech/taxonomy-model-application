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

/**
 * Represent a file entry of specific type and a selected file
 * @param fileType
 * @param fileChangeHandler
 * @constructor
 */

/* WORKS
export const FileEntry = ({fileType, selectedFile, notifySelectedFileChange}: FileEntryProps) => {
  const generateUniqueId = () => {
    return Math.random().toString(36).substr(2, 9);
  };

  const uniqueId: string = generateUniqueId();//"04db94c6-7f5d-494c-8b6d-c4c765c10aff"

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target?.files![0]) {
      notifySelectedFileChange(fileType, e.target?.files![0]);
    }
  }

  const deleteHandler = () => {
    notifySelectedFileChange(fileType, null);
  }

  return <div className="entry">
    {
      selectedFile ?
        <Fab color="secondary" size="small" component="span" aria-label={`Remove ${mapFileTypeToName(fileType)} csv file`} variant="extended" sx={{textTransform:'none'}} onClick={deleteHandler}>
          <RemoveIcon/> {mapFileTypeToName(fileType)}: {selectedFile.name}
        </Fab>
        :<div>
          <input id={uniqueId} type='file' style={{display: 'none'}} datatype='.csv' onChange={handleChange}/>
          <Fab color="primary" size="small" component="span" aria-label={`Add ${mapFileTypeToName(fileType)} csv file`} variant="extended"
               onClick={()=>document.getElementById(uniqueId)!.click()}
          >
            <AddIcon/>{mapFileTypeToName(fileType)}
          </Fab>
        </div>
    }
  </div>
}

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
    if (notifySelectedFileChange) // notify the parent component if it has provided handler
      notifySelectedFileChange(fileType, file);
  }

  return <div>
    {
      selectedFile ?
        <Fab {...commonFabProps} {...selectedFileFabProps} color='secondary'
             aria-label={`Remove ${fileTypeName} csv file`}
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
                 onChange={fileChangedHandler}/>
          <Fab {...commonFabProps} color='primary' aria-label={`Add ${fileTypeName} csv file`}
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