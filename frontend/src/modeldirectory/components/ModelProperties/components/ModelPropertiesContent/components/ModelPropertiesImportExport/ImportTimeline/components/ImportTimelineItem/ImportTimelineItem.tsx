import React from "react";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import { Typography } from "@mui/material";
import {
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator,
} from "@mui/lab";
import ImportProcessStateContent from "src/modeldirectory/components/ModelProperties/components/ModelPropertiesContent/components/ModelPropertiesImportExport/ImportTimeline/components/ImportProcessStateContent/ImportProcessStateContent";
import { formatDate } from "src/theme/PropertyFieldLayout/FormattedDatePropertyField/userFriendlyDateFormat";

interface ImportTimelineItemProps {
  importProcessState: ModelInfoTypes.ImportProcessState;
}

const uniqueId = "920424ec-c21e-4673-a127-6c92451a38dc";

export const DATA_TEST_ID = {
  IMPORT_TIMELINE_ITEM: `import-timeline-item-${uniqueId}`,
  IMPORT_TIMELINE_SEPARATOR: `import-timeline-separator-${uniqueId}`,
  IMPORT_TIMELINE_CONNECTOR: `import-timeline-connector-${uniqueId}`,
  IMPORT_TIMELINE_DOT: `import-timeline-dot-${uniqueId}`,
  IMPORT_TIMELINE_CONTENT: `import-timeline-content-${uniqueId}`,
  IMPORT_TIMELINE_OPPOSITE_CONTENT: `import-timeline-opposite-content-${uniqueId}`,
  IMPORT_TIMELINE_OPPOSITE_CONTENT_TIMESTAMP: `import-timeline-opposite-content-created-at-${uniqueId}`,
  FALLBACK_TEXT: `import-timeline-fallback-text-${uniqueId}`,
};

/**
 * ImportTimelineItem is responsible for showing the import status and duration and a timeline with a timestamp
 * @param props
 * @constructor
 */

const ImportTimelineItem: React.FC<ImportTimelineItemProps> = (props: Readonly<ImportTimelineItemProps>) => {
  return (
    <TimelineItem data-testid={DATA_TEST_ID.IMPORT_TIMELINE_ITEM}>
      <TimelineOppositeContent
        data-testid={DATA_TEST_ID.IMPORT_TIMELINE_OPPOSITE_CONTENT}
        sx={{ maxWidth: "fit-content", flex: 0.5, padding: 0, paddingRight: (theme) => theme.tabiyaSpacing.md }}
      >
        {props.importProcessState.createdAt ? (
          <Typography
            variant={"body1"}
            data-testid={DATA_TEST_ID.IMPORT_TIMELINE_OPPOSITE_CONTENT_TIMESTAMP}
            sx={{ textAlign: "start" }}
          >
            {formatDate(props.importProcessState.createdAt)}
          </Typography>
        ) : (
          <Typography variant={"body2"} data-testid={DATA_TEST_ID.FALLBACK_TEXT} sx={{ textAlign: "start" }}>
            {"Import has not started yet"}
          </Typography>
        )}
      </TimelineOppositeContent>
      <TimelineSeparator data-testid={DATA_TEST_ID.IMPORT_TIMELINE_SEPARATOR}>
        <TimelineDot data-testid={DATA_TEST_ID.IMPORT_TIMELINE_DOT} />
        <TimelineConnector data-testid={DATA_TEST_ID.IMPORT_TIMELINE_CONNECTOR} />
      </TimelineSeparator>
      <TimelineContent data-testid={DATA_TEST_ID.IMPORT_TIMELINE_CONTENT}>
        <ImportProcessStateContent importProcessState={props.importProcessState} />
      </TimelineContent>
    </TimelineItem>
  );
};

export default ImportTimelineItem;
