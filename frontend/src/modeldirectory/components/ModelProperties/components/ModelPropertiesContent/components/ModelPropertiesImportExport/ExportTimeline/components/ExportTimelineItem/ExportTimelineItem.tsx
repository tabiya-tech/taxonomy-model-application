import React from "react";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import {
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator,
} from "@mui/lab";
import { Typography } from "@mui/material";
import ExportProcessStateContent from "src/modeldirectory/components/ModelProperties/components/ModelPropertiesContent/components/ModelPropertiesImportExport/ExportTimeline/components/ExportProcessStateContent/ExportProcessStateContent";
import {
  formatDate
} from "src/theme/PropertyFieldLayout/FormattedDatePropertyField/userFriendlyDateFormat";

interface ExportTimelineItemProps {
  exportProcessState: ModelInfoTypes.ExportProcessState;
}

const uniqueId = "e50b6e98-dd42-4e1b-b7c8-7a282f67b032";
export const DATA_TEST_ID = {
  EXPORT_TIMELINE_ITEM: `export-timeline-item-${uniqueId}`,
  EXPORT_TIMELINE_SEPARATOR: `export-timeline-separator-${uniqueId}`,
  EXPORT_TIMELINE_DOT: `export-timeline-dot-${uniqueId}`,
  EXPORT_TIMELINE_CONNECTOR: `export-timeline-connector-${uniqueId}`,
  EXPORT_TIMELINE_CONTENT: `export-timeline-content-${uniqueId}`,
  EXPORT_TIMELINE_OPPOSITE_CONTENT: `export-timeline-opposite-content-${uniqueId}`,
  EXPORT_TIMELINE_OPPOSITE_CONTENT_CREATED_AT: `export-timeline-opposite-content-created-at-${uniqueId}`,
};

/**
 * ExportTimelineItem is responsible for showing a timeline item with the export process state content and creation date
 */
const ExportTimelineItem: React.FC<ExportTimelineItemProps> = (props) => {
  return (
    <TimelineItem data-testid={DATA_TEST_ID.EXPORT_TIMELINE_ITEM}>
      <TimelineOppositeContent
        data-testid={DATA_TEST_ID.EXPORT_TIMELINE_OPPOSITE_CONTENT}
        sx={{ maxWidth: "fit-content", flex: 0.5, padding: 0, paddingRight: (theme) => theme.tabiyaSpacing.md }}
      >
        <Typography variant={"body1"} data-testid={DATA_TEST_ID.EXPORT_TIMELINE_OPPOSITE_CONTENT_CREATED_AT}>
          {formatDate(props.exportProcessState.createdAt)}
        </Typography>
      </TimelineOppositeContent>
      <TimelineSeparator data-testid={DATA_TEST_ID.EXPORT_TIMELINE_SEPARATOR}>
        <TimelineDot data-testid={DATA_TEST_ID.EXPORT_TIMELINE_DOT} />
        <TimelineConnector data-testid={DATA_TEST_ID.EXPORT_TIMELINE_CONNECTOR} />
      </TimelineSeparator>
      <TimelineContent data-testid={DATA_TEST_ID.EXPORT_TIMELINE_CONTENT}>
        <ExportProcessStateContent exportProcessState={props.exportProcessState} />
      </TimelineContent>
    </TimelineItem>
  );
};

export default ExportTimelineItem;
