import * as React from "react";
import FileEntry from "./FileEntry";
import ImportAPISpecs from "api-specifications/import";
import { Box, FormLabel, Grid, Stack } from "@mui/material";
import { generateUniqueId } from "src/utils/generateUniqueId";
import { useStyles } from "src/theme/global.style";

export interface ImportFilesSelectionProps {
  notifySelectedFileChange?: (fileType: ImportAPISpecs.Constants.ImportFileTypes, newFile: File | null) => void;
}

const baseTestID = "e60583c2-9ce5-47e0-bb8f-d2a4349dde15";

export const DATA_TEST_ID = {
  IMPORT_FILES_SELECTION: `import-files-selection-${baseTestID}`,
};

const ImportFilesSelection = (props: Readonly<ImportFilesSelectionProps>) => {
  const uniqueId = generateUniqueId();
  const classes = useStyles();
  return (
    <Stack className={classes.fieldStack} spacing={0.5} data-testid={DATA_TEST_ID.IMPORT_FILES_SELECTION}>
      <FormLabel required htmlFor={uniqueId}>
        Select files to import
      </FormLabel>
      <Grid id={uniqueId} sx={{ display: "flex", flexWrap: "wrap" }}>
        {Object.entries(ImportAPISpecs.Constants.ImportFileTypes).map((entry) => (
          <Box
            key={entry[0]}
            sx={{
              flex: "0 0 auto",
              marginBottom: (theme) => theme.tabiyaSpacing.sm,
              marginRight: (theme) => theme.tabiyaRounding.sm,
            }}
          >
            <FileEntry
              fileType={entry[0] as ImportAPISpecs.Constants.ImportFileTypes}
              notifySelectedFileChange={props.notifySelectedFileChange}
            />
          </Box>
        ))}
      </Grid>
    </Stack>
  );
};

export default ImportFilesSelection;
