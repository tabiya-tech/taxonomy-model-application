import React from "react";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import { VisualMock } from "src/_test_utilities/VisualMock";

interface ExportTimelineItemProps {
  exportProcessState: ModelInfoTypes.ExportProcessState;
}

/**
 * ExportTimelineItem is responsible for showing a timeline item with the export process state content and creation date
 */
const ExportTimelineItem: React.FC<ExportTimelineItemProps> = (props) => {
  return <VisualMock text="ExportTimelineItem" />;
};

export default ExportTimelineItem;
