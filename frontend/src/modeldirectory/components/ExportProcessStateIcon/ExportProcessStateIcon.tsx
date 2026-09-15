import CloudDownloadIcon from "@mui/icons-material/CloudDownload";

import * as React from "react";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import { PulsatingIcon } from "src/theme/PulsatingIcon/PulsatingIcon";
import { EXPORT_PROCESS_STATUS } from "src/api-types";

const uniqueId = "bae86ed9-33bf-4492-a0e2-f9c8bd112bae";
export const DATA_TEST_ID = {
  ICON_STATUS_PENDING: `icon-status-pending-${uniqueId}`,
  ICON_STATUS_COMPLETED: `icon-status-success-${uniqueId}`,
  ICON_STATUS_RUNNING: `icon-status-running-${uniqueId}`,
  ICON_STATUS_UNKNOWN: `icon-status-unknown-${uniqueId}`,
};

export type ExportStatusIconProps = {
  exportProcessState: ModelInfoTypes.ExportProcessState;
};

export function ExportProcessStateIcon(props: Readonly<ExportStatusIconProps>) {
  switch (props?.exportProcessState?.status) {
    case EXPORT_PROCESS_STATUS.RUNNING:
      return (
        <PulsatingIcon
          icon={CloudDownloadIcon}
          titleAccess="Export in progress"
          color="info"
          data-testid={DATA_TEST_ID.ICON_STATUS_RUNNING}
        />
      );
    case EXPORT_PROCESS_STATUS.PENDING:
      return (
        <CloudDownloadIcon titleAccess="Pending" color="disabled" data-testid={DATA_TEST_ID.ICON_STATUS_PENDING} />
      );
    case EXPORT_PROCESS_STATUS.COMPLETED: {
      const result = props.exportProcessState.result;
      let title = "Export was successful";
      let color: "success" | "error" | "warning" = "success";

      if (result.exportWarnings) {
        color = "warning";
        title = "Export completed with warnings";
      }

      if (result.exportErrors) {
        color = "error";
        title = "Exported completed with errors";
      }

      if (result.errored) {
        color = "error";
        title = "Export failed";
      }

      return <CloudDownloadIcon titleAccess={title} data-testid={DATA_TEST_ID.ICON_STATUS_COMPLETED} color={color} />;
    }
    default:
      return <div title="Unknown export status" data-testid={DATA_TEST_ID.ICON_STATUS_UNKNOWN} />;
  }
}

export default ExportProcessStateIcon;
