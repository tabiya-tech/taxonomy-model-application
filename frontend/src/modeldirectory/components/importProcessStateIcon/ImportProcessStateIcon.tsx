import ImportProcessStateAPISpecs from "api-specifications/importProcessState";
import {
  CheckCircle,
  Circle,
  ErrorOutline,
  WatchLater
} from "@mui/icons-material";
import * as React from "react";
import {ModelInfoTypes} from "src/modelInfo/modelInfoTypes";

const uniqueId = "bae86ed9-33bf-4492-a0e2-f9c8bd112bae";
export const DATA_TEST_ID = {
  ICON_STATUS_PENDING: `icon-status-pending-${uniqueId}`,
  ICON_STATUS_SUCCESS: `icon-status-success-${uniqueId}`,
  ICON_STATUS_FAILED: `icon-status-failed-${uniqueId}`,
  ICON_STATUS_RUNNING: `icon-status-running-${uniqueId}`,
  ICON_STATUS_UNKNOWN: `icon-status-unknown-${uniqueId}`
}

export type ImportStatusIconProps = {
  importProcessState: ModelInfoTypes.ImportProcessState
}
export default function ImportProcessStateIcon(props: ImportStatusIconProps) {
  switch (props?.importProcessState?.status) {
    case ImportProcessStateAPISpecs.Enums.Status.PENDING:
      return <WatchLater titleAccess="Pending" color="info" data-testid={DATA_TEST_ID.ICON_STATUS_PENDING}/>
    case ImportProcessStateAPISpecs.Enums.Status.RUNNING:
      return <Circle titleAccess="Running" color="info" data-testid={DATA_TEST_ID.ICON_STATUS_RUNNING}/>
    case ImportProcessStateAPISpecs.Enums.Status.COMPLETED:
      const result = props.importProcessState.result;
      if (result.errored || result.parsingErrors || result.parsingWarnings) {
        let title = "";
        if (result.errored) {
          title = "Completed with error(s)";
        } else if (result.parsingErrors) {
          title = "Completed with parsing errors(s)";
        } else {
          title = "Completed with parsing warning(s)";
        }
        const color = result.errored ? "error" : "warning";
        return <ErrorOutline titleAccess={title} color={color} data-testid={DATA_TEST_ID.ICON_STATUS_FAILED}/>
      }
      return <CheckCircle titleAccess="Completed succesfully" color="success"
                          data-testid={DATA_TEST_ID.ICON_STATUS_SUCCESS}/>
    default:
      return <div title="Unknown import status"
                           data-testid={DATA_TEST_ID.ICON_STATUS_UNKNOWN}/>
  }
};
