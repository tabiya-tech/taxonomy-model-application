import React from "react";
import {VisualMock} from "src/_test_utilities/VisualMock";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";

interface ImportTimelineItemProps {
  importProcessState: ModelInfoTypes.ImportProcessState;
}

const uniqueId = "920424ec-c21e-4673-a127-6c92451a38dc";

export const DATA_TEST_ID = {
  IMPORT_TIMESTAMP: `import-status-${uniqueId}`,
  IMPORT_PROCESS_STATE_CONTENT: `import-duration-${uniqueId}`,
  TIMELINE_OPPOSITE_CONTENT: `timeline-opposite-content-${uniqueId}`,
  TIMELINE_SEPARATOR: `timeline-separator-${uniqueId}`,
  TIMELINE_DOT: `timeline-dot-${uniqueId}`,
};

/**
 * ImportTimelineItem is responsible for showing the import status and duration and a timeline with a timestamp
 * @param props
 * @constructor
 */

const ImportTimelineItem: React.FC<ImportTimelineItemProps> = (
  props: Readonly<ImportTimelineItemProps>
) => {
  return <VisualMock text="ImportTimelineItem" />
};
