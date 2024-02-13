import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import { useTheme } from "@mui/material";
import Box from "@mui/material/Box";
import React from "react";
import ModelPropertiesItemDetails from "src/modeldirectory/components/ModelProperties/components/ModelPropertiesItemDetails/ModelPropertiesItemDetails";

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
  MODEL_PROPERTIES_RELEASED: `model-properties-released-${uniqueId}`,
  MODEL_PROPERTIES_RELEASE_NOTES: `model-properties-release-notes-${uniqueId}`,
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
      <ModelPropertiesItemDetails
        title={"UUID"}
        value={`${props.model.UUID}`}
        data-testid={DATA_TEST_ID.MODEL_PROPERTIES_UUID}
      />
      <ModelPropertiesItemDetails
        title={"Tabiya Path"}
        value={props.model.tabiyaPath}
        data-testid={DATA_TEST_ID.MODEL_PROPERTIES_TABIYA_PATH}
      />
      <ModelPropertiesItemDetails
        title={"Path"}
        value={props.model.path}
        data-testid={DATA_TEST_ID.MODEL_PROPERTIES_PATH}
      />
      <ModelPropertiesItemDetails
        title={"Version"}
        value={props.model.version}
        data-testid={DATA_TEST_ID.MODEL_PROPERTIES_VERSION}
      />
      <ModelPropertiesItemDetails
        title={"Released"}
        value={props.model.released ? "true" : "false"}
        data-testid={DATA_TEST_ID.MODEL_PROPERTIES_RELEASED}
      />
      <ModelPropertiesItemDetails
        title={"Release Notes"}
        value={props.model.releaseNotes}
        data-testid={DATA_TEST_ID.MODEL_PROPERTIES_RELEASE_NOTES}
      />
    </Box>
  );
};

export default ModelPropertiesVersion;
