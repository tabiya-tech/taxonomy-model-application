export interface ModelPropertiesHeaderProps {
  title: string;
  notifyOnClose: () => void;
}

const uniqueId = "a9f38045-7a8d-4226-88c6-8c9384516012";

export const DATA_TEST_ID = {
  MODEL_PROPERTIES_HEADER: `model-properties-header-${uniqueId}`,
  MODEL_PROPERTIES_HEADER_TITLE: `header-title-${uniqueId}`,
  MODEL_PROPERTIES_HEADER_CLOSE_BUTTON: `header-close-button-${uniqueId}`,
};

/**
 * ModelPropertiesHeader responsible for rendering the header of the model properties drawer
 * with a title and close button
 * @param props
 * @constructor
 */
function ModelPropertiesHeader(props: Readonly<ModelPropertiesHeaderProps>) {
  return (
    <div data-testid={DATA_TEST_ID.MODEL_PROPERTIES_HEADER}>
      <div data-testid={DATA_TEST_ID.MODEL_PROPERTIES_HEADER_TITLE}>{props.title}</div>
      <button data-testid={DATA_TEST_ID.MODEL_PROPERTIES_HEADER_CLOSE_BUTTON}></button>
    </div>
  );
}

export default ModelPropertiesHeader;
