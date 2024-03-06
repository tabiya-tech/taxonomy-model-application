import React from "react";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import { Typography } from "@mui/material";
import {
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator
} from "@mui/lab";
import ImportProcessStateContent from "../ImportProcessStateContent/ImportProcessStateContent";

interface ImportTimelineItemProps {
  importProcessState: ModelInfoTypes.ImportProcessState;
}

const uniqueId = "920424ec-c21e-4673-a127-6c92451a38dc";

export const DATA_TEST_ID = {
  IMPORT_TIMELINE_ITEM: `import-timeline-item-${uniqueId}`,
  IMPORT_TIMESTAMP: `import-status-${uniqueId}`,
  TIMELINE_OPPOSITE_CONTENT: `timeline-opposite-content-${uniqueId}`,
  TIMELINE_SEPARATOR: `timeline-separator-${uniqueId}`,
  TIMELINE_CONNECTOR: `timeline-connector-${uniqueId}`,
  TIMELINE_CONTENT: `timeline-content-${uniqueId}`,
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
  return (
      <TimelineItem data-testid={DATA_TEST_ID.IMPORT_TIMELINE_ITEM}>
        <TimelineOppositeContent data-testid={DATA_TEST_ID.TIMELINE_OPPOSITE_CONTENT} sx={{maxWidth: "fit-content"}}>
          <Typography variant={"body2"} data-testid={DATA_TEST_ID.IMPORT_TIMESTAMP}>
            {props.importProcessState.id}
          </Typography>
          </TimelineOppositeContent>
        <TimelineSeparator data-testid={DATA_TEST_ID.TIMELINE_SEPARATOR}>
        <TimelineDot data-testid={DATA_TEST_ID.TIMELINE_DOT}/>
        <TimelineConnector data-testid={DATA_TEST_ID.TIMELINE_CONNECTOR}/>
      </TimelineSeparator>
        <TimelineContent data-testid={DATA_TEST_ID.TIMELINE_CONTENT}>
          <ImportProcessStateContent importProcessState={props.importProcessState} />
        </TimelineContent>
    </TimelineItem>
  )
};

export default ImportTimelineItem;