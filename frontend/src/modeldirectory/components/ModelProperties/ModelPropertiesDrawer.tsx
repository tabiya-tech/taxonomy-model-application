import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";

export interface ModelPropertiesDrawerProps {
  isOpen: boolean; // for the drawer
  notifyOnClose: () => void; // for the header close button (and the footer)
  model: ModelInfoTypes.ModelInfo;
}

/**
 * ModelPropertiesDrawer responsible for rendering the drawer that displays the properties of a model
 * and using a content layout to lay out the header(ModelPropertiesHeader), a content (ModelPropertiesContent)
 * and a footer(ModelPropertiesFooter)
 * @param props
 * @constructor
 */
function ModelPropertiesDrawer(props: Readonly<ModelPropertiesDrawerProps>) {
  return <></>;
}

export default ModelPropertiesDrawer;
