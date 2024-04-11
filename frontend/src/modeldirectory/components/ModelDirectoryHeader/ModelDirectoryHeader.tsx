import React from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import PrimaryButton from "src/theme/PrimaryButton/PrimaryButton";
import { AddCircleOutlined } from "@mui/icons-material";
import { AuthContext, TabiyaUserRole } from "src/auth/AuthProvider";

const uniqueId = "8482f1cc-0786-423f-821e-34b6b712d78u";
export const DATA_TEST_ID = {
  MODEL_DIRECTORY_HEADER: `model-directory-header-${uniqueId}`,
  IMPORT_MODEL_BUTTON: `import-model-button-${uniqueId}`,
  MODEL_DIRECTORY_TITLE: `model-directory-title-${uniqueId}`,
};

export interface ModelDirectoryHeaderProps {
  onModelImport: () => void;
  isImportModelLoading: boolean;
}

const ModelDirectoryHeader: React.FC<ModelDirectoryHeaderProps> = ({
  onModelImport,
  isImportModelLoading,
}: Readonly<ModelDirectoryHeaderProps>) => {
  const { hasRole } = React.useContext(AuthContext);

  return (
    <Box
      display="flex"
      width="100%"
      justifyContent="space-between"
      flexDirection="row"
      flexWrap="wrap"
      alignItems="start"
      data-testid={DATA_TEST_ID.MODEL_DIRECTORY_HEADER}
    >
      <Typography variant="h2" data-testid={DATA_TEST_ID.MODEL_DIRECTORY_TITLE}>
        Model Directory
      </Typography>
      {hasRole(TabiyaUserRole.ModelManager) && (
        <PrimaryButton
          onClick={() => onModelImport()}
          data-testid={DATA_TEST_ID.IMPORT_MODEL_BUTTON}
          startIcon={
            isImportModelLoading ? <CircularProgress size={16} title="loading locales" /> : <AddCircleOutlined />
          }
          disableWhenOffline={true}
          disabled={isImportModelLoading}
        >
          Import Model
        </PrimaryButton>
      )}
    </Box>
  );
};

export default ModelDirectoryHeader;
