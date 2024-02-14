import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";

export interface ModelPropertiesContentProps {
  model: ModelInfoTypes.ModelInfo;
}

const uniqueId = "ee760560-4d1a-4555-89a7-1c1d0b5cbd5b";

export const DATA_TEST_ID = {
  MODEL_PROPERTIES_CONTENT: `model-properties-content-${uniqueId}`,
  MODEL_PROPERTIES_TABS: `model-properties-tabs-${uniqueId}`,
};

/**
 * ModelPropertiesContent responsible for creating the tabs (using TabFactory) for the model Properties
 * @param props
 * @constructor
 */
function ModelPropertiesContent(props: Readonly<ModelPropertiesContentProps>) {
  return (
    <div data-testid={DATA_TEST_ID.MODEL_PROPERTIES_CONTENT}>
      <div data-testid={DATA_TEST_ID.MODEL_PROPERTIES_TABS}> Model properties tabs</div>
    </div>
  );
}

export default ModelPropertiesContent;
