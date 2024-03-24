import React, { PropsWithChildren } from "react";
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
  "data-testid"?: string;
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

export const HELP_TIP_TEXT = {
  PENDING: "The import process has not yet started.",
  RUNNING: "The import process is running.",
  SUCCESS: "The import process has completed successfully.",
  ERROR:
    "The import process could not start or complete due to a technical error. Please try again later or contact us if the problem persists.",
  PARSING_ERROR:
    "The csv files have inconsistencies that could not be resolved. The model was created but is not consistent. Please review the csv files and try again.",
  PARSING_WARNING:
    "One or more rows or some fields could not be imported, but the model was still created and is consistent. Please review the csv files and try again.",
};

const Bold = ({ children }: PropsWithChildren) => (
  <Box component="span" fontWeight="bold" paddingLeft={(theme) => theme.spacing(0.5)}>
    {children}
  </Box>
);

const TypographyComponent = ({ children }: PropsWithChildren) => (
  <Typography display="flex" alignItems="center" flexWrap="wrap" data-testid={DATA_TEST_ID.MESSAGE}>
    {children}
  </Typography>
);

const Message = (props: Readonly<{ importProcessState: ModelInfoTypes.ImportProcessState }>) => {
  const { status, result } = props.importProcessState;
  switch (status) {
    case ImportProcessStateEnums.Enums.Status.PENDING:
      return (
        <TypographyComponent>
          Pending
          <HelpTip data-testid={DATA_TEST_ID.HELP_TIP_PENDING}>{HELP_TIP_TEXT.PENDING}</HelpTip>
        </TypographyComponent>
      );

    case ImportProcessStateEnums.Enums.Status.RUNNING:
      return (
        <TypographyComponent>
          Running
          <HelpTip data-testid={DATA_TEST_ID.HELP_TIP_RUNNING}>{HELP_TIP_TEXT.RUNNING}</HelpTip>
        </TypographyComponent>
      );

    case ImportProcessStateEnums.Enums.Status.COMPLETED:
      if (!result.errored && !result.parsingErrors && !result.parsingWarnings) {
        return (
          <TypographyComponent>
            Completed successfully
            <HelpTip data-testid={DATA_TEST_ID.HELP_TIP_SUCCESS}>{HELP_TIP_TEXT.SUCCESS}</HelpTip>
          </TypographyComponent>
        );
      }
      if (!result.errored && result.parsingErrors && !result.parsingWarnings) {
        return (
          <TypographyComponent>
            Completed with <Bold>parsing errors</Bold>
            <HelpTip data-testid={DATA_TEST_ID.HELP_TIP_PARSING_ERROR}>{HELP_TIP_TEXT.PARSING_ERROR}</HelpTip>
          </TypographyComponent>
        );
      }
      if (!result.errored && !result.parsingErrors && result.parsingWarnings) {
        return (
          <TypographyComponent>
            Completed with <Bold>parsing warnings</Bold>
            <HelpTip data-testid={DATA_TEST_ID.HELP_TIP_PARSING_WARNING}>{HELP_TIP_TEXT.PARSING_WARNING}</HelpTip>
          </TypographyComponent>
        );
      }
      if (!result.errored && result.parsingErrors && result.parsingWarnings) {
        return (
          <TypographyComponent>
            <span>Completed with</span>
            <Bold> parsing errors</Bold>
            <HelpTip data-testid={DATA_TEST_ID.HELP_TIP_PARSING_WARNING}>{HELP_TIP_TEXT.PARSING_ERROR}</HelpTip>
            and <Bold>parsing warnings</Bold>
            <HelpTip data-testid={DATA_TEST_ID.HELP_TIP_PARSING_WARNING}>{HELP_TIP_TEXT.PARSING_WARNING}</HelpTip>
          </TypographyComponent>
        );
      } else {
        return (
          <TypographyComponent>
            Completed with <Bold>critical errors</Bold>
            <HelpTip data-testid={DATA_TEST_ID.HELP_TIP_ERROR}>{HELP_TIP_TEXT.ERROR}</HelpTip>
          </TypographyComponent>
        );
      }
    default:
      return <TypographyComponent>Completed with unexpected status {status}</TypographyComponent>;
  }
};

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
    <PropertyFieldLayout title="Status" data-testid={props["data-testid"]} fieldId={props.fieldId}>
      <Box display="flex" flexDirection="row" alignItems="center" gap={theme.spacing(1)}>
        <ImportProcessStateIcon
          data-testid={DATA_TEST_ID.PROCCESS_STATUS_ICON}
          importProcessState={props.importProcessState}
        />
        <Message importProcessState={props.importProcessState} />
      </Box>
    </PropertyFieldLayout>
  );
};

export default ImportStatusPropertyField;
