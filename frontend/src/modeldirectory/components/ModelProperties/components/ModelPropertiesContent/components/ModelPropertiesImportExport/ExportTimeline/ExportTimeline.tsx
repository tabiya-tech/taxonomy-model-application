import React from "react";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import { Timeline } from "@mui/lab";
import ExportTimelineItem from "./components/ExportTimelineItem/ExportTimelineItem";
import { Typography } from "@mui/material";

interface ExportTimelineProps {
  exportProcessStates: ModelInfoTypes.ExportProcessState[];
}

const uniqueId = "a5bebb18-bfb7-4393-a6b4-83cbbfcf4926";
export const DATA_TEST_ID = {
  EXPORT_TIMELINE: `export-timeline-${uniqueId}`,
};

/**
 * ExportTimeline is responsible for showing a timeline with the export process entries for a model
 */
const ExportTimeline: React.FC<ExportTimelineProps> = (props) => {
  return (
    <Timeline data-testid={DATA_TEST_ID.EXPORT_TIMELINE} sx={{ padding: 0 }}>
      {props.exportProcessStates.length ? (
        props.exportProcessStates.map((exportProcessState) => (
          <ExportTimelineItem exportProcessState={exportProcessState} key={exportProcessState.id} />
        ))
      ) : (
        <Typography>This model has not been exported yet.</Typography>
      )}
    </Timeline>
  );
};

export default ExportTimeline;
