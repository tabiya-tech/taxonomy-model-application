import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";

export interface ModelPropertiesContentProps {
  model: ModelInfoTypes.ModelInfo;
}

/**
 * ModelPropertiesContent responsible for creating the tabs (using TabFactory) for the model Properties
 * @param props
 * @constructor
 */
function ModelPropertiesContent(props: Readonly<ModelPropertiesContentProps>) {
  return <></>;
}

export default ModelPropertiesContent;
