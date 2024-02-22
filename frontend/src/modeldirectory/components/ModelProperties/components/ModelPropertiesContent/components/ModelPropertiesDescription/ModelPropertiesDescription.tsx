import React from "react";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material";
import TextPropertyField from "src/theme/PropertyFieldLayout/TextPropertyField/TextPropertyField";

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

const FIELD_ID = {
  NAME: `name-${uniqueId}`,
  LOCALE: `locale-${uniqueId}`,
  DESCRIPTION: `description-${uniqueId}`,
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
      <TextPropertyField
        label={"Name"}
        text={`${props.model.name}`}
        data-testid={DATA_TEST_ID.MODEL_PROPERTIES_NAME}
        fieldId={FIELD_ID.NAME}
      />
      <TextPropertyField
        label={"Locale"}
        text={`${props.model.locale.name}(${props.model.locale.shortCode})`}
        data-testid={DATA_TEST_ID.MODEL_PROPERTIES_LOCALE}
        fieldId={FIELD_ID.LOCALE}
      />
      <TextPropertyField
        label={"Desciption"}
        text={props.model.description}
        data-testid={DATA_TEST_ID.MODEL_PROPERTIES_DESCRIPTION}
        fieldId={FIELD_ID.DESCRIPTION}
      />
    </Box>
  );
};

export default ModelPropertiesDescription;
