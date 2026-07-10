import React from "react";
import { Box, CircularProgress, Link, Typography } from "@mui/material";
import PrimaryButton from "src/theme/PrimaryButton/PrimaryButton";
import { AddCircleOutlined } from "@mui/icons-material";
import { AuthContext } from "src/auth/AuthProvider";
import AuthAPISpecs from "api-specifications/auth";

const uniqueId = "8482f1cc-0786-423f-821e-34b6b712d78u";
export const DATA_TEST_ID = {
  MODEL_DIRECTORY_HEADER: `model-directory-header-${uniqueId}`,
  IMPORT_MODEL_BUTTON: `import-model-button-${uniqueId}`,
  MODEL_DIRECTORY_TITLE: `model-directory-title-${uniqueId}`,
  MODEL_DIRECTORY_INTRO: `model-directory-intro-${uniqueId}`,
  MODEL_DIRECTORY_INTRO_SECONDARY: `model-directory-intro-secondary-${uniqueId}`,
};

export const TEXT = {
  TITLE: "Our taxonomies",
  INTRO:
    "Each taxonomy can be explored in the browser, integrated via the read API, or downloaded as CSV. " +
    "Expand a taxonomy for earlier versions.",
  INTRO_SECONDARY_BEFORE_LINK: "Country versions are derived from Base with our open localization framework. See ",
  INTRO_SECONDARY_LINK: "tabiya-esco-localization",
  INTRO_SECONDARY_AFTER_LINK: " for how we adapt the taxonomy to each labour market.",
};

export const LOCALIZATION_REPO_URL = "https://github.com/tabiya-tech/tabiya-esco-localization";

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
      flexDirection="column"
      gap={(theme) => theme.tabiyaSpacing.sm}
      data-testid={DATA_TEST_ID.MODEL_DIRECTORY_HEADER}
    >
      <Box
        display="flex"
        width="100%"
        justifyContent="space-between"
        flexDirection="row"
        flexWrap="wrap"
        alignItems="start"
      >
        <Typography variant="h2" data-testid={DATA_TEST_ID.MODEL_DIRECTORY_TITLE}>
          {TEXT.TITLE}
        </Typography>
        {hasRole(AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER) && (
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
      <Typography variant="body1" data-testid={DATA_TEST_ID.MODEL_DIRECTORY_INTRO}>
        {TEXT.INTRO}
      </Typography>
      <Typography variant="body2" color="text.secondary" data-testid={DATA_TEST_ID.MODEL_DIRECTORY_INTRO_SECONDARY}>
        {TEXT.INTRO_SECONDARY_BEFORE_LINK}
        <Link href={LOCALIZATION_REPO_URL} target="_blank" rel="noreferrer noopener" fontWeight="bold">
          {TEXT.INTRO_SECONDARY_LINK}
        </Link>
        {TEXT.INTRO_SECONDARY_AFTER_LINK}
      </Typography>
    </Box>
  );
};

export default ModelDirectoryHeader;
