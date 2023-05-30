import * as React from "react";
import FileEntry from './FileEntry';
import {ImportFileTypes} from "api-specifications/import";
import {FormLabel, Grid, Stack} from "@mui/material";
import {generateUniqueId} from "src/utils/generateUniqueId";
import {useStyles} from "src/theme/global.style";

export interface ImportFilesSelectionProps {
  notifySelectedFileChange?: (fileType: ImportFileTypes, newFile: File | null) => void
}

const baseTestID = "e60583c2-9ce5-47e0-bb8f-d2a4349dde15"

export const DATA_TEST_ID = {
  IMPORT_FILES_SELECTION: `import-files-selection-${baseTestID}`
}

const ImportFilesSelection = (props: ImportFilesSelectionProps) => {
  const uniqueId = generateUniqueId();
  const classes = useStyles();
  return <Stack className={classes.fieldStack} spacing={0.5} data-testid={DATA_TEST_ID.IMPORT_FILES_SELECTION}>
      <FormLabel required htmlFor={uniqueId}>Select files to import</FormLabel>
      <Grid id={uniqueId} style={{display: 'flex', flexWrap: 'wrap'}}>
        {Object.entries(ImportFileTypes).map((entry) => (
          <div key={entry[0]} style={{flex: '0 0 auto', marginBottom: '10px', marginRight: '10px'}}>
            <FileEntry
              fileType={entry[0] as ImportFileTypes}
              notifySelectedFileChange={props.notifySelectedFileChange}
            />
          </div>
        ))}
      </Grid>
    </Stack>
};

export default ImportFilesSelection;