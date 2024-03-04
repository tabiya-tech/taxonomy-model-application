import React from "react";
import {VisualMock} from "src/_test_utilities/VisualMock";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";

interface ImportTimelineProps {
  importProcessState: ModelInfoTypes.ImportProcessState;
}

const uniqueId = "48d564f1-fe4b-4c2f-bfc4-023cde28397f";

export const DATA_TEST_ID = {
  IMPORT_TIMELINE_ITEM: `import-timeline-item-${uniqueId}`,
};

/**
 * ImportTimeline is responsible for showing the import timeline
 * @param props
 * @constructor
 */

const ImportTimeline: React.FC<ImportTimelineProps> = (
  props: Readonly<ImportTimelineProps>
) => {
  return <VisualMock text="ImportTimeline" />
};
