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
}

export const uniqueId = "56ea04a0-f80e-4cd0-b967-eb55d108f1b6";

export const DATA_TEST_ID = {
  IMPORT_STATUS_FIELD: `status-${uniqueId}`,
  PROCCESS_STATUS_ICON: `process-status-icon-${uniqueId}`,
  MESSAGE: `message-${uniqueId}`
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

  const Meessage = () => {
    const { status, result } = props.importProcessState

    if(status === ImportProcessStateEnums.Enums.Status.PENDING) {
      return <Typography data-testid={DATA_TEST_ID.MESSAGE}>Pending</Typography>
    }

    if(status === ImportProcessStateEnums.Enums.Status.RUNNING) {
      return <Typography data-testid={DATA_TEST_ID.MESSAGE}>Running</Typography>
    }

    if((status === ImportProcessStateEnums.Enums.Status.COMPLETED) && !result.errored && !result.parsingErrors && !result.parsingWarnings) {
      return <Typography data-testid={DATA_TEST_ID.MESSAGE}>Completed successfully</Typography>
    }

    if((status === ImportProcessStateEnums.Enums.Status.COMPLETED) && result.errored && !result.parsingErrors && !result.parsingWarnings) {
      return (
          <Typography data-testid={DATA_TEST_ID.MESSAGE}>
            Completed with
            <Box component={"span"} fontWeight={"bold"}> critical errors</Box>
            <HelpTip>The import process could not start or complete due to a technical error. Please try again later or contact us if the problem persists.</HelpTip>
          </Typography>
      )
    }

    if((status === ImportProcessStateEnums.Enums.Status.COMPLETED) && !result.errored && result.parsingErrors && !result.parsingWarnings) {
      return (
          <Typography data-testid={DATA_TEST_ID.MESSAGE}>
            Completed with
            <Box component={"span"} fontWeight={"bold"}> parsing errors</Box>
            <HelpTip>
              The esv files have inconsistencies that could not be resolved. The model was created but is not consistent.
              Please review the csv files and try again.
            </HelpTip>
          </Typography>
      )
    }

    if((status === ImportProcessStateEnums.Enums.Status.COMPLETED) && !result.errored && !result.parsingErrors && result.parsingWarnings) {
      return (
        <Typography data-testid={DATA_TEST_ID.MESSAGE}>
          Completed with
          <Box component={"span"} fontWeight={"bold"}> parsing warnings</Box>
          <HelpTip>
            One or more rows or some field could not be imported, but the model was still created and is consistent.
            Please review the csv files and try again.
          </HelpTip>
        </Typography>
      )
    }

    if((status === ImportProcessStateEnums.Enums.Status.COMPLETED) && !result.errored && result.parsingErrors && result.parsingWarnings) {
      return (
        <Typography data-testid={DATA_TEST_ID.MESSAGE}>
          <Box component={"span"}>Completed with </Box>
          <Box component={"span"} fontWeight={"bold"}>
            parsing errors
          </Box>
          <HelpTip>
            The esv files have inconsistencies that could not be resolved. The model was created but is not consistent.
            Please review the csv files and try again.
          </HelpTip>
          and
          <Box component={"span"} fontWeight={"bold"}> parsing warnings</Box>
          <HelpTip>
            One or more rows or some field could not be imported, but the model was still created and is consistent.
            Please review the csv files and try again.
          </HelpTip>
        </Typography>
      )
    }

    return <Typography>Unknown Status</Typography>
  }

  return (
    <PropertyFieldLayout title={"Status"} fieldId={props.fieldId}>
      <Box display={"flex"} gap={theme.spacing(1)} alignItems={"center"} data-testid={DATA_TEST_ID.IMPORT_STATUS_FIELD}>
        <ImportProcessStateIcon test-dataId={DATA_TEST_ID.PROCCESS_STATUS_ICON} importProcessState={props.importProcessState} />
        <Meessage/>
      </Box>
    </PropertyFieldLayout>
  )
};

export default ImportStatusPropertyField;
