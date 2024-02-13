import React from "react";
import { useTheme } from "@mui/material";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import Box from "@mui/material/Box";
import ModelPropertiesItemDetails from "src/modeldirectory/components/ModelProperties/components/ModelPropertiesItemDetails/ModelPropertiesItemDetails";
import { formattedDate } from "src/utils/userFriendlyDateFormat";

export interface ModelPropertiesHistoryProps {
  model: ModelInfoTypes.ModelInfo;
}

const uniqueId = "08e457ca-63fa-4a92-b5fa-729a444ab827";

export const DATA_TEST_ID = {
  MODEL_PROPERTIES_HISTORY_CONTAINER: `model-properties-history-container-${uniqueId}`,
  MODEL_PROPERTIES_CREATED_DATE: `model-properties-created-date-${uniqueId}`,
  MODEL_PROPERTIES_UPDATED_DATE: `model-properties-updated-date-${uniqueId}`,
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
      <ModelPropertiesItemDetails
        title={"Date Created"}
        value={formattedDate(props.model.createdAt)}
        data-testid={DATA_TEST_ID.MODEL_PROPERTIES_CREATED_DATE}
      />
      <ModelPropertiesItemDetails
        title={"Last Updated"}
        value={formattedDate(props.model.updatedAt)}
        data-testid={DATA_TEST_ID.MODEL_PROPERTIES_UPDATED_DATE}
      />
    </Box>
  );
};

export default ModelPropertiesHistory;
