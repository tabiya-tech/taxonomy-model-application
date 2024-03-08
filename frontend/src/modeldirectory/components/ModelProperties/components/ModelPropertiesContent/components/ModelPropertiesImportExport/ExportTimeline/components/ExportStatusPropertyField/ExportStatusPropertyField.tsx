import { Typography, useTheme } from "@mui/material";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import React, { PropsWithChildren } from "react";
import Box from "@mui/material/Box";
import ExportProcessStateEnums from "api-specifications/exportProcessState/enums";
import HelpTip from "src/theme/HelpTip/HelpTip";
import PropertyFieldLayout from "src/theme/PropertyFieldLayout/PropertyFieldLayout";
import ExportProcessStateIcon from "src/modeldirectory/components/ExportProcessStateIcon/ExportProcessStateIcon";

interface ExportStatusPropertyFieldProps {
  exportProcessState: ModelInfoTypes.ExportProcessState;
  fieldId: string;
  "data-testid"?: string;
}

export const uniqueId = "c2031286-4333-4e71-a003-388bf91dc1b9";

export const DATA_TEST_ID = {
  MESSAGE: `message-${uniqueId}`,
  PROCESS_STATUS_ICON: `process-status-icon-${uniqueId}`,
  HELP_TIP_SUCCESS: `help-tip-success-${uniqueId}`,
  HELP_TIP_ERROR: `help-tip-error-${uniqueId}`,
  HELP_TIP_EXPORT_WARNING: `help-tip-export-warning-${uniqueId}`,
  HELP_TIP_EXPORT_ERROR: `help-tip-export-error-${uniqueId}`,
  HELP_TIP_RUNNING: `help-tip-running-${uniqueId}`,
  HELP_TIP_PENDING: `help-tip-pending-${uniqueId}`,
};

export const HELP_TIP_TEXT = {
  PENDING: "The export process has not yet started.",
  RUNNING: "The export process is running.",
  SUCCESS: "The export process has completed successfully.",
  ERROR:
    "The export process could not start or complete due to a technical error. Please try again later or contact us if the problem persists.",
  EXPORT_ERROR:
    "The csv files have inconsistencies that could not be resolved. The model was exported but is not consistent. Please review the csv files and try again.",
  EXPORT_WARNING:
    "One or more rows or some field could not be exported, but the model was still exported and is consistent. Please review the csv files and try again.",
};

const Bold = ({ children }: PropsWithChildren) => (
  <Box component="span" fontWeight="bold">
    {children}
  </Box>
);

const Message = (props: Readonly<{ exportProcessState: ModelInfoTypes.ExportProcessState }>) => {
  const { status, result } = props.exportProcessState;

  switch (status) {
    case ExportProcessStateEnums.Status.PENDING:
      return (
        <Typography data-testid={DATA_TEST_ID.MESSAGE}>
          Pending
          <HelpTip data-testid={DATA_TEST_ID.HELP_TIP_PENDING}>{HELP_TIP_TEXT.PENDING}</HelpTip>
        </Typography>
      );
    case ExportProcessStateEnums.Status.RUNNING:
      return (
        <Typography data-testid={DATA_TEST_ID.MESSAGE}>
          Running
          <HelpTip data-testid={DATA_TEST_ID.HELP_TIP_RUNNING}>{HELP_TIP_TEXT.RUNNING}</HelpTip>
        </Typography>
      );

    case ExportProcessStateEnums.Status.COMPLETED:
      if (!result.errored && !result.exportErrors && !result.exportWarnings) {
        return (
          <Typography data-testid={DATA_TEST_ID.MESSAGE}>
            Completed successfully
            <HelpTip data-testid={DATA_TEST_ID.HELP_TIP_SUCCESS}>{HELP_TIP_TEXT.SUCCESS}</HelpTip>
          </Typography>
        );
      }

      if (!result.errored && result.exportErrors && !result.exportWarnings) {
        return (
          <Typography data-testid={DATA_TEST_ID.MESSAGE}>
            Completed with <Bold>export errors</Bold>
            <HelpTip data-testid={DATA_TEST_ID.HELP_TIP_EXPORT_ERROR}>{HELP_TIP_TEXT.EXPORT_ERROR}</HelpTip>
          </Typography>
        );
      }
      if (!result.errored && !result.exportErrors && result.exportWarnings) {
        return (
          <Typography data-testid={DATA_TEST_ID.MESSAGE}>
            Completed with <Bold>export warnings</Bold>
            <HelpTip data-testid={DATA_TEST_ID.HELP_TIP_EXPORT_WARNING}>{HELP_TIP_TEXT.EXPORT_WARNING}</HelpTip>
          </Typography>
        );
      }
      if (!result.errored && result.exportErrors && result.exportWarnings) {
        return (
          <Typography data-testid={DATA_TEST_ID.MESSAGE}>
            <span>Completed with</span>
            <Bold> export errors</Bold>
            <HelpTip data-testid={DATA_TEST_ID.HELP_TIP_EXPORT_ERROR}>{HELP_TIP_TEXT.EXPORT_ERROR}</HelpTip>
            and <Bold>export warnings</Bold>
            <HelpTip data-testid={DATA_TEST_ID.HELP_TIP_EXPORT_WARNING}>{HELP_TIP_TEXT.EXPORT_WARNING}</HelpTip>
          </Typography>
        );
      } else {
        return (
          <Typography data-testid={DATA_TEST_ID.MESSAGE}>
            Completed with <Bold>critical errors</Bold>
            <HelpTip data-testid={DATA_TEST_ID.HELP_TIP_ERROR}>{HELP_TIP_TEXT.ERROR}</HelpTip>
          </Typography>
        );
      }
    default:
      return <Typography data-testid={DATA_TEST_ID.MESSAGE}>Completed with unexpected status {status}</Typography>;
  }
};

/**
 * ExportStatusPropertyField is responsible for showing the export status
 * @param props
 * @constructor
 */

const ExportStatusPropertyField: React.FC<ExportStatusPropertyFieldProps> = (
  props: Readonly<ExportStatusPropertyFieldProps>
) => {
  const theme = useTheme();

  return (
    <PropertyFieldLayout title="Status" fieldId={props.fieldId} data-testid={props["data-testid"]}>
      <Box display="flex" flexDirection="row" alignItems="center" gap={theme.spacing(1)}>
        <Box
          sx={{
            padding: theme.spacing(0.5),
          }}
        >
          <ExportProcessStateIcon
            exportProcessState={props.exportProcessState}
            data-tested={DATA_TEST_ID.PROCESS_STATUS_ICON}
          />
        </Box>
        <Message exportProcessState={props.exportProcessState} />
      </Box>
    </PropertyFieldLayout>
  );
};

export default ExportStatusPropertyField;
