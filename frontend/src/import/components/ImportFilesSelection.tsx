import * as React from "react";
import FileEntry from './FileEntry';
import {ImportFileTypes} from "api-specifications/import";
import {FormLabel, Grid, Stack} from "@mui/material";
import {generateUniqueId} from "src/utils/generateUniqueId";
import {useStyles} from "src/global.style";

export interface ImportFilesSelectionProps {
  notifySelectedFileChange?: (fileType: ImportFileTypes, newFile: File | null) => void
}

const ImportFilesSelection = ({notifySelectedFileChange}: ImportFilesSelectionProps) => {
  const uniqueId = generateUniqueId();
  const classes = useStyles();
  return (
    <Stack className={classes.fieldStack} spacing={0.5}>
      <FormLabel htmlFor={uniqueId}>Select files to import</FormLabel>
      <Grid id={uniqueId} style={{display: 'flex', flexWrap: 'wrap'}}>
        {Object.entries(ImportFileTypes).map((entry) => (
          <div key={entry[0]} style={{flex: '0 0 auto', marginBottom: '10px', marginRight: '10px'}}>
            <FileEntry
              fileType={entry[0] as ImportFileTypes}
              notifySelectedFileChange={notifySelectedFileChange}
            />
          </div>
        ))}
      </Grid>
    </Stack>
  );
};

export default ImportFilesSelection;