import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";

enum CloseEventName {
  DISMISS = "DISMISS",
}
export type CloseEvent = { name: CloseEventName }

export interface ModelPropertiesDrawerProps {
  isOpen: boolean; // for the drawer
  notifyOnClose: (event : CloseEvent) => void; // for the header close button (and the footer)
  model: ModelInfoTypes.ModelInfo;
}

const uniqueId = "a76cf289-b403-4782-a886-b56047a8fff9"

export const DATA_TEST_ID = {
  MODEL_PROPERTIES_DRAWER: `model-properties-drawer-${uniqueId}`,
};

/**
 * ModelPropertiesDrawer responsible for rendering the drawer that displays the properties of a model
 * and using a content layout to lay out the header(ModelPropertiesHeader), a content (ModelPropertiesContent)
 * and a footer(ModelPropertiesFooter)
 * @param props
 * @constructor
 */
function ModelPropertiesDrawer(props: Readonly<ModelPropertiesDrawerProps>) {
  return <div data-testid={DATA_TEST_ID.MODEL_PROPERTIES_DRAWER}></div>;
}

export default ModelPropertiesDrawer;
