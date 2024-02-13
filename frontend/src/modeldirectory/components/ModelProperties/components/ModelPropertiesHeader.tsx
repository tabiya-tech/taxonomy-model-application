export interface ModelPropertiesHeaderProps {
  title: string;
  notifyOnClose: () => void; // Bit of a prop drilly way to do it, consider using a context
}

/**
 * ModelPropertiesHeader responsible for rendering the header of the model properties drawer
 * with a title and close button
 * @param props
 * @constructor
 */
function ModelPropertiesHeader(props: Readonly<ModelPropertiesHeaderProps>) {
  return <></>;
}

export default ModelPropertiesHeader;
