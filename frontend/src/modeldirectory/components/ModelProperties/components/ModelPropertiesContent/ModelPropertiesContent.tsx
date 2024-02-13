import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import TabControl from "src/theme/TabControl/TabControl";
import ModelPropertiesDescription from "./components/ModelPropertiesDescription/ModelPropertiesDescription";
import ModelPropertiesVersion from "./components/ModelPropertiesVersion/ModelPropertiesVersion";
import { Box } from "@mui/material";
import ModelPropertiesHistory from "./components/ModelPropertiesHistory/ModelPropertiesHistory";

export interface ModelPropertiesContentProps {
  model: ModelInfoTypes.ModelInfo;
}

const uniqueId = "ee760560-4d1a-4555-89a7-1c1d0b5cbd5b";

export const DATA_TEST_ID = {
  MODEL_PROPERTIES_CONTENT: `model-properties-content-${uniqueId}`,
  MODEL_PROPERTIES_TABS: `model-properties-tabs-${uniqueId}`,
};

export const MODEL_PROPERTIES_TAB_LABEL = {
  TAB_LABEL_DEFINITION: "Definition",
  TAB_LABEL_VERSION: "Version",
  TAB_LABEL_HISTORY: "History",
};

export const MODEL_PROPERTIES_TAB_ID = {
  TAB_ID_DEFINITION: `model-properties-definition-tab-${uniqueId}`,
  TAB_ID_VERSION: `model-properties-version-tab-${uniqueId}`,
  TAB_ID_HISTORY: `model-properties-history-tab-${uniqueId}`,
};

/**
 * ModelPropertiesContent responsible for creating the tabs (using TabFactory) for the model Properties
 * @param props
 * @constructor
 */
function ModelPropertiesContent(props: Readonly<ModelPropertiesContentProps>) {
  const tabItems = [
    {
      id: MODEL_PROPERTIES_TAB_ID.TAB_ID_DEFINITION,
      label: MODEL_PROPERTIES_TAB_LABEL.TAB_LABEL_DEFINITION,
      panel: <ModelPropertiesDescription model={props.model} />,
    },
    {
      id: MODEL_PROPERTIES_TAB_ID.TAB_ID_VERSION,
      label: MODEL_PROPERTIES_TAB_LABEL.TAB_LABEL_VERSION,
      panel: <ModelPropertiesVersion model={props.model} />,
    },
    {
      id: MODEL_PROPERTIES_TAB_ID.TAB_ID_HISTORY,
      label: MODEL_PROPERTIES_TAB_LABEL.TAB_LABEL_HISTORY,
      panel: <ModelPropertiesHistory model={props.model} />,
    },
  ];

  return (
    <Box data-testid={DATA_TEST_ID.MODEL_PROPERTIES_CONTENT} sx={{ height: "100%" }}>
      <TabControl
        data-testid={DATA_TEST_ID.MODEL_PROPERTIES_TABS}
        items={tabItems}
        aria-label={"Model properties tabs"}
      />
    </Box>
  );
}

export default ModelPropertiesContent;
