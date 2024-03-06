import React from "react";
import { useTheme } from "@mui/material";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import Box from "@mui/material/Box";
import FormattedDatePropertyField from "src/theme/PropertyFieldLayout/FormattedDatePropertyField/FormattedDatePropertyField";

export interface ModelPropertiesHistoryProps {
  model: ModelInfoTypes.ModelInfo;
}

const uniqueId = "08e457ca-63fa-4a92-b5fa-729a444ab827";

export const DATA_TEST_ID = {
  MODEL_PROPERTIES_HISTORY_CONTAINER: `model-properties-history-container-${uniqueId}`,
  MODEL_PROPERTIES_CREATED_DATE: `model-properties-created-date-${uniqueId}`,
  MODEL_PROPERTIES_UPDATED_DATE: `model-properties-updated-date-${uniqueId}`,
};

const FIELD_ID = {
  DATE_CREATED: `created-${uniqueId}`,
  LAST_UPDATED: `updated-${uniqueId}`,
};

export const FIELD_LABEL_TEXT = {
  CREATION_DATE: "Creation Date",
  LAST_UPDATE: "Last Update",
};

/**
 * ModelPropertiesHistory responsible for displaying the history of the model
 * like created date, updated date, etc.
 * @param props
 * @constructor
 */

const ModelPropertiesHistory: React.FC<ModelPropertiesHistoryProps> = (
  props: Readonly<ModelPropertiesHistoryProps>
) => {
  const theme = useTheme();

  return (
    <Box
      display="flex"
      flexDirection="column"
      gap={theme.tabiyaSpacing.md}
      data-testid={DATA_TEST_ID.MODEL_PROPERTIES_HISTORY_CONTAINER}
    >
      <FormattedDatePropertyField
        label={FIELD_LABEL_TEXT.CREATION_DATE}
        date={props.model.createdAt}
        data-testid={DATA_TEST_ID.MODEL_PROPERTIES_CREATED_DATE}
        fieldId={FIELD_ID.DATE_CREATED}
      />
      <FormattedDatePropertyField
        label={FIELD_LABEL_TEXT.LAST_UPDATE}
        date={props.model.updatedAt}
        data-testid={DATA_TEST_ID.MODEL_PROPERTIES_UPDATED_DATE}
        fieldId={FIELD_ID.LAST_UPDATED}
      />
    </Box>
  );
};

export default ModelPropertiesHistory;
