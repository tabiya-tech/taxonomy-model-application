import React from "react";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import ExportStatusPropertyField from "../ExportStatusPropertyField/ExportStatusPropertyField";
import DurationPropertyField from "src/theme/PropertyFieldLayout/DurationPropertyField/DurationPropertyField";

interface ExportProcessStateContentProps {
  exportProcessState: ModelInfoTypes.ExportProcessState;
}

const uniqueId = "333ab3d5-61a7-4169-8af9-01fe57ed5673";

export const DATA_TEST_ID = {
  EXPORT_PROCESS_STATE_CONTENT: `export-process-state-content-${uniqueId}`,
  EXPORT_STATUS_FIELD: `export-status-${uniqueId}`,
  EXPORT_DURATION_FIELD: `export-duration-${uniqueId}`,
};

export const FIELD_ID = {
  EXPORT_STATUS_FIELD: `export-status-${uniqueId}`,
  EXPORT_DURATION_FIELD: `export-duration-${uniqueId}`,
};

/**
 * ExportProcessStateContent is responsible for showing the export process status and the duration
 * @param props
 * @constructor
 */

const ExportProcessStateContent: React.FC<ExportProcessStateContentProps> = (
  props: Readonly<ExportProcessStateContentProps>
) => {
  const theme = useTheme();

  return (
    <Box
      display="flex"
      flexDirection="column"
      gap={theme.tabiyaSpacing.md}
      paddingY={theme.tabiyaSpacing.lg}
      data-testid={DATA_TEST_ID.EXPORT_PROCESS_STATE_CONTENT}
    >
      <ExportStatusPropertyField
        exportProcessState={props.exportProcessState}
        fieldId={FIELD_ID.EXPORT_STATUS_FIELD+"-"+props.exportProcessState.id}
        data-testid={DATA_TEST_ID.EXPORT_STATUS_FIELD}
      />
      <DurationPropertyField
        label="Duration"
        firstDate={props.exportProcessState.createdAt}
        secondDate={props.exportProcessState.updatedAt}
        fieldId={FIELD_ID.EXPORT_DURATION_FIELD+"-"+props.exportProcessState.id}
        data-testid={DATA_TEST_ID.EXPORT_DURATION_FIELD}
      />
    </Box>
  );
};

export default ExportProcessStateContent;
