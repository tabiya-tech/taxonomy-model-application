import React from "react";
import { Box, Typography } from "@mui/material";
import PrimaryButton from "../../../theme/PrimaryButton/PrimaryButton";
import { AddCircleOutlined } from "@mui/icons-material";

const uniqueId = "8482f1cc-0786-423f-821e-34b6b712d78u";
export const DATA_TEST_ID = {
  MODEL_DIRECTORY_HEADER: `model-directory-header-${uniqueId}`,
  IMPORT_MODEL_BUTTON: `import-model-button-${uniqueId}`,
  MODEL_DIRECTORY_TITLE: `model-directory-title-${uniqueId}`,
};

export interface ModelDirectoryHeaderProps {
  onModelImport: () => void;
}

const ModelDirectoryHeader: React.FC<ModelDirectoryHeaderProps> = ({ onModelImport }: Readonly<ModelDirectoryHeaderProps>) => (
  <Box
    display="flex"
    width="100%"
    justifyContent="space-between"
    alignItems="center"
    data-testid={DATA_TEST_ID.MODEL_DIRECTORY_HEADER}
  >
    <Typography variant="h2" data-testid={DATA_TEST_ID.MODEL_DIRECTORY_TITLE}>
      Model Directory
    </Typography>
    <PrimaryButton
      onClick={() => onModelImport()}
      data-testid={DATA_TEST_ID.IMPORT_MODEL_BUTTON}
      startIcon={<AddCircleOutlined />}
    >
      Import Model
    </PrimaryButton>
  </Box>
);

export default ModelDirectoryHeader;
