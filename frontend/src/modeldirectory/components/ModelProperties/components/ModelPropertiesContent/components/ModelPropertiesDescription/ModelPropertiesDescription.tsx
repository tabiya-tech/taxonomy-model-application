import React from "react";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import Box from "@mui/material/Box";
import ModelPropertiesItemDetails from "src/modeldirectory/components/ModelProperties/components/ModelPropertiesItemDetails/ModelPropertiesItemDetails";
import { useTheme } from "@mui/material";

export interface ModelPropertiesDescriptionProps {
  model: ModelInfoTypes.ModelInfo;
}

const uniqueId = "2dc9c69b-bd8f-4b51-bff8-69faa511a316";

export const DATA_TEST_ID = {
  MODEL_PROPERTIES_DESCRIPTION_CONTAINER: `model-properties-description-container-${uniqueId}`,
  MODEL_PROPERTIES_NAME: `model-properties-name-${uniqueId}`,
  MODEL_PROPERTIES_LOCALE: `model-properties-locale-${uniqueId}`,
  MODEL_PROPERTIES_DESCRIPTION: `model-properties-description-${uniqueId}`,
};

/**
 * ModelPropertiesDescription responsible for displaying the basic details of a model
 * like description, locale, etc.
 * @param props
 * @constructor
 */
const ModelPropertiesDescription: React.FC<ModelPropertiesDescriptionProps> = (
  props: Readonly<ModelPropertiesDescriptionProps>
) => {
  const theme = useTheme();

  return (
    <Box
      display="flex"
      flexDirection="column"
      gap={theme.tabiyaSpacing.md}
      data-testid={DATA_TEST_ID.MODEL_PROPERTIES_DESCRIPTION_CONTAINER}
    >
      <ModelPropertiesItemDetails
        title={"Name"}
        value={`${props.model.name}`}
        data-testid={DATA_TEST_ID.MODEL_PROPERTIES_NAME}
      />
      <ModelPropertiesItemDetails
        title={"Locale"}
        value={`${props.model.locale.name}(${props.model.locale.shortCode})`}
        data-testid={DATA_TEST_ID.MODEL_PROPERTIES_LOCALE}
      />
      <ModelPropertiesItemDetails
        title={"Description"}
        value={props.model.description}
        data-testid={DATA_TEST_ID.MODEL_PROPERTIES_DESCRIPTION}
      />
    </Box>
  );
};

export default ModelPropertiesDescription;
