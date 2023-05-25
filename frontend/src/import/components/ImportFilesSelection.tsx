import * as React from "react";
import FileEntry from './FileEntry';
import {ImportFileTypes} from "api-specifications/import";
import {FormLabel} from "@mui/material";
import {generateUniqueId} from "src/utils/generateUniqueId";


export interface ImportFilesSelectionProps {
  notifySelectedFileChange?: (fileType: ImportFileTypes, newFile: File | null) => void
}

 const ImportFilesSelection = ({notifySelectedFileChange}: ImportFilesSelectionProps) => {
  const uniqueId = generateUniqueId();
  return (
    <div>
      <FormLabel htmlFor={uniqueId}>Select files to import</FormLabel>
      <div id={uniqueId} style={{display: 'flex', flexWrap: 'wrap'}}>
        {Object.entries(ImportFileTypes).map((entry, index) => (
          <div key={index} style={{flex: '0 0 auto', marginBottom: '10px', marginRight: '10px'}}>
            <FileEntry
              fileType={entry[0] as ImportFileTypes}
              notifySelectedFileChange={notifySelectedFileChange}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImportFilesSelection;