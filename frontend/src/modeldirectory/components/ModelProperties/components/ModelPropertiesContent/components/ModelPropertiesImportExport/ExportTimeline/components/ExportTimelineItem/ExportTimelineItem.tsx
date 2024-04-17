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
import { Typography, useTheme } from "@mui/material";
import ExportProcessStateContent from "src/modeldirectory/components/ModelProperties/components/ModelPropertiesContent/components/ModelPropertiesImportExport/ExportTimeline/components/ExportProcessStateContent/ExportProcessStateContent";
import { formatDate } from "src/theme/PropertyFieldLayout/FormattedDatePropertyField/userFriendlyDateFormat";
import DownloadModelButton from "src/modeldirectory/components/DownloadModelButton/DownloadModelButton";

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
  const theme = useTheme();
  return (
    <TimelineItem data-testid={DATA_TEST_ID.EXPORT_TIMELINE_ITEM}>
      <TimelineOppositeContent
        data-testid={DATA_TEST_ID.EXPORT_TIMELINE_OPPOSITE_CONTENT}
        display={"flex"}
        flexDirection={"column"}
        alignItems={"flex-start"}
        gap={theme.tabiyaSpacing.md}
        sx={{ maxWidth: "35%", padding: 0, paddingRight: theme.tabiyaSpacing.md }}
      >
        <Typography
          variant={"body1"}
          data-testid={DATA_TEST_ID.EXPORT_TIMELINE_OPPOSITE_CONTENT_CREATED_AT}
          sx={{ textAlign: "start" }}
        >
          {formatDate(props.exportProcessState.createdAt)}
        </Typography>
        {props.exportProcessState.downloadUrl && (
          <DownloadModelButton downloadUrl={props.exportProcessState.downloadUrl} />
        )}
      </TimelineOppositeContent>
      <TimelineSeparator data-testid={DATA_TEST_ID.EXPORT_TIMELINE_SEPARATOR}>
        <TimelineDot
          data-testid={DATA_TEST_ID.EXPORT_TIMELINE_DOT}
          color={"primary"}
          sx={{ margin: (theme) => theme.tabiyaSpacing.xs }}
        />
        <TimelineConnector
          data-testid={DATA_TEST_ID.EXPORT_TIMELINE_CONNECTOR}
          sx={{ backgroundColor: theme.palette.primary.main }}
        />
      </TimelineSeparator>
      <TimelineContent data-testid={DATA_TEST_ID.EXPORT_TIMELINE_CONTENT}>
        <ExportProcessStateContent exportProcessState={props.exportProcessState} />
      </TimelineContent>
    </TimelineItem>
  );
};

export default ExportTimelineItem;
