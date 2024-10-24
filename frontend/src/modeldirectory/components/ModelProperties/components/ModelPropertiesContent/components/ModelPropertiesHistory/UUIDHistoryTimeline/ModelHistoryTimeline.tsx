import React from "react";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";

import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  timelineItemClasses,
  TimelineSeparator,
} from "@mui/lab";
import { Typography } from "@mui/material";

interface UUIDHistoryTimelineProps {
  UUIDHistoryDetails: ModelInfoTypes.ModelHistory[];
}

const uniqueId = "48d564f1-fe4b-4c2f-bfc4-023cde28397f";
export const DATA_TEST_ID = {
  UUID_HISTORY_TIMELINE: `uuid-history-timeline-${uniqueId}`,
  UUID_HISTORY_TIMELINE_ITEM: `uuid-history-timeline-item-${uniqueId}`,
  UUID_HISTORY_TIMELINE_SEPARATOR: `uuid-history-timeline-separator-${uniqueId}`,
  UUID_HISTORY_TIMELINE_DOT: `uuid-history-timeline-dot-${uniqueId}`,
  UUID_HISTORY_TIMELINE_CONNECTOR: `uuid-history-timeline-connector-${uniqueId}`,
  UUID_HISTORY_TIMELINE_CONTENT: `uuid-history-timeline-content-${uniqueId}`,
};

const ModelHistoryTimeline: React.FC<UUIDHistoryTimelineProps> = (props) => {
  return (
    <Timeline
      data-testid={DATA_TEST_ID.UUID_HISTORY_TIMELINE}
      sx={{
        [`& .${timelineItemClasses.root}:before`]: {
          flex: 0,
          padding: 0,
        },
      }}
    >
      {props.UUIDHistoryDetails.map((UUIDHistory, index, array) => (
        <TimelineItem
          data-testid={DATA_TEST_ID.UUID_HISTORY_TIMELINE_ITEM}
          key={UUIDHistory.UUID}
          sx={{ minHeight: (theme) => theme.spacing(5) }}
        >
          <TimelineSeparator data-testid={DATA_TEST_ID.UUID_HISTORY_TIMELINE_SEPARATOR}>
            <TimelineDot
              data-testid={DATA_TEST_ID.UUID_HISTORY_TIMELINE_DOT}
              color="primary"
              sx={{ margin: (theme) => theme.tabiyaSpacing.xs }}
            />
            {index !== array.length - 1 && (
              <TimelineConnector
                data-testid={DATA_TEST_ID.UUID_HISTORY_TIMELINE_CONNECTOR}
                sx={{ backgroundColor: (theme) => theme.palette.primary.main }}
              />
            )}
          </TimelineSeparator>
          <TimelineContent
            data-testid={DATA_TEST_ID.UUID_HISTORY_TIMELINE_CONTENT}
            sx={{ paddingTop: 0, paddingBottom: (theme) => theme.tabiyaSpacing.sm }}
          >
            <Typography variant="body1">
              {UUIDHistory.id === null ||
              UUIDHistory.name === null ||
              UUIDHistory.version === null ||
              UUIDHistory.localeShortCode === null
                ? `${UUIDHistory.UUID}: (details not available)`
                : `${UUIDHistory.name} ${UUIDHistory.version} (${UUIDHistory.localeShortCode})`}
            </Typography>
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
};

export default ModelHistoryTimeline;
