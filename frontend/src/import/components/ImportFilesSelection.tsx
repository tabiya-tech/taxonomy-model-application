import * as React from "react";
import FileEntry from "./FileEntry";
import ImportAPISpecs from "api-specifications/import";
import { Box, FormLabel, Grid, Stack, useTheme } from "@mui/material";
import ModelInfoFileEntry from "./ModelInfoFileEntry";
import LicenseFileEntry from "./LicenseFileEntry";

export interface ImportFilesSelectionProps {
  notifySelectedFileChange?: (fileType: ImportAPISpecs.Constants.ImportFileTypes, newFile: File | null) => void;
  notifyUUIDHistoryChange?: (newUUIDHistory: string[]) => void;
  notifyOnLicenseChange?: (license: string) => void;
  notifyOnDescriptionChange?: (description: string) => void;
}

const uniqueId = "e60583c2-9ce5-47e0-bb8f-d2a4349dde15";

export const DATA_TEST_ID = {
  IMPORT_FILES_SELECTION: `import-files-selection-${uniqueId}`,
};

const ImportFilesSelection = (props: Readonly<ImportFilesSelectionProps>) => {
  const theme = useTheme();

  return (
    <Stack spacing={theme.tabiyaSpacing.xs} data-testid={DATA_TEST_ID.IMPORT_FILES_SELECTION}>
      <FormLabel required>Select files to import</FormLabel>
      <Grid sx={{ display: "flex", flexWrap: "wrap" }}>
        {Object.entries(ImportAPISpecs.Constants.ImportFileTypes).map((entry) => (
          <Box
            key={`${uniqueId}-${entry[0]}`}
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
        <Box
          key={`${uniqueId}-modelInfo`}
          sx={{
            flex: "0 0 auto",
            marginBottom: (theme) => theme.tabiyaSpacing.sm,
            marginRight: (theme) => theme.tabiyaRounding.sm,
          }}
        >
          <ModelInfoFileEntry
            notifyUUIDHistoryChange={props.notifyUUIDHistoryChange}
            notifyOnDescriptionChange={props.notifyOnDescriptionChange}
          />
        </Box>
        <Box
          key={`${uniqueId}-license`}
          sx={{
            flex: "0 0 auto",
            marginBottom: (theme) => theme.tabiyaSpacing.sm,
            marginRight: (theme) => theme.tabiyaRounding.sm,
          }}
        >
          <LicenseFileEntry notifyOnLicenseChange={props.notifyOnLicenseChange} />
        </Box>
      </Grid>
    </Stack>
  );
};

export default ImportFilesSelection;
