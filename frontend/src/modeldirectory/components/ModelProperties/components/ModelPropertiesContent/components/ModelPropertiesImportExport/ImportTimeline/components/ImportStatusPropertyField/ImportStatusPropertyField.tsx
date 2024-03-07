import React from "react";
import Box from "@mui/material/Box";
import HelpTip from "src/theme/HelpTip/HelpTip";
import { Typography, useTheme } from "@mui/material";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import ImportProcessStateEnums from "api-specifications/importProcessState";
import ImportProcessStateIcon from "src/modeldirectory/components/ImportProcessStateIcon/ImportProcessStateIcon";
import PropertyFieldLayout from "src/theme/PropertyFieldLayout/PropertyFieldLayout";

interface ImportStatusPropertyFieldProps {
  importProcessState: ModelInfoTypes.ImportProcessState;
  fieldId: string;
  dataTestId?: string;
}

export const uniqueId = "d321d7cc-6396-43c8-bec9-70a04fdb3607";

export const DATA_TEST_ID = {
  PROCCESS_STATUS_ICON: `process-status-icon-${uniqueId}`,
  MESSAGE: `message-${uniqueId}`,
  HELP_TIP_SUCCESS: `help-tip-success-${uniqueId}`,
  HELP_TIP_ERROR: `help-tip-error-${uniqueId}`,
  HELP_TIP_PARSING_WARNING: `help-tip-parsing-warning-${uniqueId}`,
  HELP_TIP_PARSING_ERROR: `help-tip-parsing-error-${uniqueId}`,
  HELP_TIP_RUNNING: `help-tip-running-${uniqueId}`,
  HELP_TIP_PENDING: `help-tip-pending-${uniqueId}`,
};

export const MESSAGE_TEXT = {
  PENDING: "Pending...",
  RUNNING: "Running...",
  COMPLETED_SUCCESS: "Completed successfully!",
  COMPLETED_ERROR: "Completed with critical errors",
  COMPLETED_PARSING_ERROR: "Completed with parsing errors",
  COMPLETED_PARSING_WARNING: "Completed with parsing warnings",
  COMPLETED_PARSING_ERROR_AND_WARNING: "Completed with parsing errors and warnings",
};

export const HELP_TIP_TEXT = {
  PENDING: "The import process has not yet started.",
  RUNNING: "The import process is running.",
  SUCCESS: "The import process has completed successfully.",
  ERROR: "The import process could not start or complete due to a technical error. Please try again later or contact us if the problem persists.",
  PARSING_ERROR: "The csv files have inconsistencies that could not be resolved. The model was created but is not consistent. Please review the csv files and try again.",
  PARSING_WARNING: "One or more rows or some field could not be imported, but the model was still created and is consistent. Please review the csv files and try again.",
};

const PendingMessage = () => {
  return (
    <Typography data-testid={DATA_TEST_ID.MESSAGE}>
      {MESSAGE_TEXT.PENDING}
      <HelpTip data-testid={DATA_TEST_ID.HELP_TIP_PENDING}>{HELP_TIP_TEXT.PENDING}</HelpTip>
    </Typography>
  );
};

const RunningMessage = () => {
  return <Typography data-testid={DATA_TEST_ID.MESSAGE}>
    {MESSAGE_TEXT.RUNNING}
    <HelpTip data-testid={DATA_TEST_ID.HELP_TIP_RUNNING}>{HELP_TIP_TEXT.RUNNING}</HelpTip>
  </Typography>
};

const CompletedWithoutErrorsMessage = () => {
  return <Typography data-testid={DATA_TEST_ID.MESSAGE}>
    {MESSAGE_TEXT.COMPLETED_SUCCESS}
    <HelpTip data-testid={DATA_TEST_ID.HELP_TIP_SUCCESS}>{HELP_TIP_TEXT.SUCCESS}</HelpTip>
  </Typography>
};

const CompletedWithCriticalErrorsMessage = () => {
  return <Typography data-testid={DATA_TEST_ID.MESSAGE}>
    {MESSAGE_TEXT.COMPLETED_ERROR}
    <HelpTip data-testid={DATA_TEST_ID.HELP_TIP_ERROR}>{HELP_TIP_TEXT.ERROR}</HelpTip>
  </Typography>
};

const CompletedWithParsingErrorsMessage = () => {
  return <Typography data-testid={DATA_TEST_ID.MESSAGE}>
    {MESSAGE_TEXT.COMPLETED_PARSING_ERROR}
    <HelpTip data-testid={DATA_TEST_ID.HELP_TIP_PARSING_ERROR}>{HELP_TIP_TEXT.PARSING_ERROR}</HelpTip>
  </Typography>
};

const CompletedWithParsingWarningsMessage = () => {
  return <Typography data-testid={DATA_TEST_ID.MESSAGE}>
    {MESSAGE_TEXT.COMPLETED_PARSING_WARNING}
    <HelpTip data-testid={DATA_TEST_ID.HELP_TIP_PARSING_WARNING}>{HELP_TIP_TEXT.PARSING_WARNING}</HelpTip>
  </Typography>
};

const CompletedWithParsingErrorsAndWarningsMessage = () => {
  return <Typography data-testid={DATA_TEST_ID.MESSAGE}>
    {MESSAGE_TEXT.COMPLETED_PARSING_ERROR} <span><HelpTip data-testid={DATA_TEST_ID.HELP_TIP_PARSING_ERROR}>{HELP_TIP_TEXT.PARSING_ERROR}</HelpTip></span>
    and {MESSAGE_TEXT.COMPLETED_PARSING_WARNING}
    <span><HelpTip data-testid={DATA_TEST_ID.HELP_TIP_PARSING_WARNING}>{HELP_TIP_TEXT.PARSING_WARNING}</HelpTip></span>
  </Typography>
};

const Message = (props: Readonly<{importProcessState: ModelInfoTypes.ImportProcessState}>) => {
  const { status, result } = props.importProcessState;
  switch (status) {
    case ImportProcessStateEnums.Enums.Status.PENDING:
      return <PendingMessage/>;

    case ImportProcessStateEnums.Enums.Status.RUNNING:
      return <RunningMessage/>;

    case ImportProcessStateEnums.Enums.Status.COMPLETED:
      if (!result.errored && !result.parsingErrors && !result.parsingWarnings) {
        return <CompletedWithoutErrorsMessage/>;
      }
      if (result.errored && !result.parsingErrors && !result.parsingWarnings) {
        return <CompletedWithCriticalErrorsMessage/>;
      }
      if (!result.errored && result.parsingErrors && !result.parsingWarnings) {
        return <CompletedWithParsingErrorsMessage/>;
      }
      if (!result.errored && !result.parsingErrors && result.parsingWarnings) {
        return <CompletedWithParsingWarningsMessage/>;
      }
      if (!result.errored && result.parsingErrors && result.parsingWarnings) {
        return <CompletedWithParsingErrorsAndWarningsMessage/>;
      }
      return <Typography data-testid={DATA_TEST_ID.MESSAGE}>Completed with unexpected results</Typography>;

    default:
      return <Typography>Unknown Status</Typography>;
  }
}

/**
 * ImportStatusPropertyField is responsible for showing the import status
 * @param props
 * @constructor
 */

const ImportStatusPropertyField: React.FC<ImportStatusPropertyFieldProps> = (
  props: Readonly<ImportStatusPropertyFieldProps>
) => {
  const theme = useTheme();

  return (
    <PropertyFieldLayout title={"Status"} fieldId={props.fieldId}>
      <Box display={"flex"} flexDirection={"row"} alignItems={"center"} gap={theme.spacing(1)} data-testid={props["dataTestId"]}>
        <ImportProcessStateIcon test-dataId={DATA_TEST_ID.PROCCESS_STATUS_ICON} importProcessState={props.importProcessState} />
        <Message importProcessState={props.importProcessState}/>
      </Box>
    </PropertyFieldLayout>
  )
};

export default ImportStatusPropertyField;