import React from "react";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import { Timeline } from "@mui/lab";
import ImportTimelineItem from "./components/ImportTimelineItem/ImportTimelineItem";
interface ImportTimelineProps {
  importProcessState: ModelInfoTypes.ImportProcessState;
}

const uniqueId = "48d564f1-fe4b-4c2f-bfc4-023cde28397f";

export const DATA_TEST_ID = {
  IMPORT_TIMELINE: `import-timeline-${uniqueId}`,
};

/**
 * ImportTimeline is responsible for showing the import timeline
 * @param props
 * @constructor
 */

const ImportTimeline: React.FC<ImportTimelineProps> = (props: Readonly<ImportTimelineProps>) => {
  return (
    <Timeline data-testid={DATA_TEST_ID.IMPORT_TIMELINE}>
      <ImportTimelineItem importProcessState={props.importProcessState} />
    </Timeline>
  );
};

export default ImportTimeline;
