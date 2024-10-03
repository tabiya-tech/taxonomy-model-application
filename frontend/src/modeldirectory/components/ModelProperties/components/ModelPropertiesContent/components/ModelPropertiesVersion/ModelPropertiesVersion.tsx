import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import { useTheme } from "@mui/material";
import Box from "@mui/material/Box";
import React from "react";
import TextPropertyField from "src/theme/PropertyFieldLayout/TextPropertyField/TextPropertyField";
import ReleasedPropertyField from "src/theme/PropertyFieldLayout/ReleasedPropertyField/ReleasedPropertyField";
import MarkdownPropertyField from "src/theme/PropertyFieldLayout/MarkdownPropertyField/MarkdownPropertyField";

export interface ModelPropertiesVersionProps {
  model: ModelInfoTypes.ModelInfo;
}

const uniqueId = "8d3b0caa-95e2-4f11-a98c-054208e72438";

export const DATA_TEST_ID = {
  MODEL_PROPERTIES_VERSION_CONTAINER: `model-properties-version-container-${uniqueId}`,
  MODEL_PROPERTIES_UUID: `model-properties-uuid-${uniqueId}`,
  MODEL_PROPERTIES_TABIYA_PATH: `model-properties-tabiya-path-${uniqueId}`,
  MODEL_PROPERTIES_PATH: `model-properties-path-${uniqueId}`,
  MODEL_PROPERTIES_VERSION: `model-properties-version-${uniqueId}`,
  MODEL_PROPERTIES_RELEASED_STATUS: `model-properties-released-status-${uniqueId}`,
  MODEL_PROPERTIES_RELEASE_NOTES: `model-properties-release-notes-${uniqueId}`,
};

export const FIELD_ID = {
  UUID: `uuid-${uniqueId}`,
  TABIYA_PATH: `tabiya-path-${uniqueId}`,
  PATH: `path-${uniqueId}`,
  VERSION: `version-${uniqueId}`,
  RELEASED_STATUS: `released-status-${uniqueId}`,
  RELEASE_NOTES: `release-notes-${uniqueId}`,
};

export const FIELD_LABEL_TEXT = {
  LABEL_UUID: "UUID",
  LABEL_TABIYA_PATH: "Tabiya Path",
  LABEL_PATH: "Path",
  LABEL_VERSION: "Version",
  LABEL_RELEASE_NOTES: "Release Notes",
};

/**
 * ModelPropertiesVersion responsible for displaying the version details of a model
 * like UUID, tabiyaPath, path, version, released, release notes, etc.
 * @param props
 * @constructor
 */

const ModelPropertiesVersion: React.FC<ModelPropertiesVersionProps> = (
  props: Readonly<ModelPropertiesVersionProps>
) => {
  const theme = useTheme();

  return (
    <Box
      display="flex"
      flexDirection="column"
      gap={theme.tabiyaSpacing.md}
      data-testid={DATA_TEST_ID.MODEL_PROPERTIES_VERSION_CONTAINER}
    >
      <TextPropertyField
        label={FIELD_LABEL_TEXT.LABEL_UUID}
        text={`${props.model.UUID}`}
        data-testid={DATA_TEST_ID.MODEL_PROPERTIES_UUID}
        fieldId={FIELD_ID.UUID}
      />

      <TextPropertyField
        label={FIELD_LABEL_TEXT.LABEL_TABIYA_PATH}
        text={`${props.model.tabiyaPath}`}
        data-testid={DATA_TEST_ID.MODEL_PROPERTIES_TABIYA_PATH}
        fieldId={FIELD_ID.TABIYA_PATH}
      />

      <TextPropertyField
        label={FIELD_LABEL_TEXT.LABEL_PATH}
        text={`${props.model.path}`}
        data-testid={DATA_TEST_ID.MODEL_PROPERTIES_PATH}
        fieldId={FIELD_ID.PATH}
      />

      <TextPropertyField
        label={FIELD_LABEL_TEXT.LABEL_VERSION}
        text={`${props.model.version}`}
        data-testid={DATA_TEST_ID.MODEL_PROPERTIES_VERSION}
        fieldId={FIELD_ID.VERSION}
      />

      <ReleasedPropertyField
        released={props.model.released}
        data-testid={DATA_TEST_ID.MODEL_PROPERTIES_RELEASED_STATUS}
        fieldId={FIELD_ID.RELEASED_STATUS}
      />

      <MarkdownPropertyField
        label={FIELD_LABEL_TEXT.LABEL_RELEASE_NOTES}
        text={props.model.releaseNotes}
        data-testid={DATA_TEST_ID.MODEL_PROPERTIES_RELEASE_NOTES}
        fieldId={FIELD_ID.RELEASE_NOTES}
      />
    </Box>
  );
};

export default ModelPropertiesVersion;
