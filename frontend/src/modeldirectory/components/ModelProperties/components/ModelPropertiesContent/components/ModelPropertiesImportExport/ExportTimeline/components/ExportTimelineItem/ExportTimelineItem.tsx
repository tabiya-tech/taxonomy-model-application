import React from "react";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";

interface ExportTimelineItemProps {
  exportProcessState: ModelInfoTypes.ExportProcessState;
}

const uniqueId =  'e50b6e98-dd42-4e1b-b7c8-7a282f67b032';
export const DATA_TEST_ID = {
  EXPORT_TIMELINE_ITEM: `export-timeline-item-${uniqueId}`
}

/**
 * ExportTimelineItem is responsible for showing a timeline item with the export process state content and creation date
 */
const ExportTimelineItem: React.FC<ExportTimelineItemProps> = (props) => {
  return <li>ExportTimelineItem</li>;
};

export default ExportTimelineItem;
