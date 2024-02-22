import React from "react";
import { useTheme } from "@mui/material";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import Box from "@mui/material/Box";
import { formattedDate } from "src/utils/userFriendlyDateFormat";
import TextPropertyField from "src/theme/PropertyFieldLayout/TextPropertyField/TextPropertyField";

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
      <TextPropertyField
        label={"Date Created"}
        text={formattedDate(props.model.createdAt)}
        data-testid={DATA_TEST_ID.MODEL_PROPERTIES_CREATED_DATE}
        fieldId={FIELD_ID.DATE_CREATED}
      />
      <TextPropertyField
        label={"Last Updated"}
        text={formattedDate(props.model.updatedAt)}
        data-testid={DATA_TEST_ID.MODEL_PROPERTIES_UPDATED_DATE}
        fieldId={FIELD_ID.LAST_UPDATED}
      />
    </Box>
  );
};

export default ModelPropertiesHistory;
