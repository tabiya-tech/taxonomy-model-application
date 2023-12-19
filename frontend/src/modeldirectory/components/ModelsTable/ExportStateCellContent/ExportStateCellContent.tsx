import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import { DownloadModelButton } from "src/modeldirectory/components/DownloadModelButton/DownloadModelButton";
import ExportProcessStateIcon from "src/modeldirectory/components/ExportProcessStateIcon/ExportProcessStateIcon";
import ExportProcessStateAPISpecs from "api-specifications/exportProcessState";
import * as React from "react";

function isSuccessfulExport(exportProcessState: ModelInfoTypes.ExportProcessState): boolean {
  return (
    exportProcessState &&
    exportProcessState.status === ExportProcessStateAPISpecs.Enums.Status.COMPLETED &&
    !exportProcessState.result.errored &&
    !exportProcessState.result.exportErrors &&
    !exportProcessState.result.exportWarnings
  );
}

interface ExportStateCellProps {
  model: ModelInfoTypes.ModelInfo;
}

const uniqueId = "fe7db48f-9846-478f-b3e0-b299fb30775e";
export const DATA_TEST_ID = {
  EMPTY_DIV: `empty-div-${uniqueId}`,
};

export function ExportStateCellContent(props: Readonly<ExportStateCellProps>) {
  // Can download only if the last export was successful and there were no errors or warnings
  const sortedExportProcessStates = props.model.exportProcessState.toSorted(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );

  if (sortedExportProcessStates.length === 0) {
    return <div data-testid={DATA_TEST_ID.EMPTY_DIV} />;
  }

  const latestExportProcessState = sortedExportProcessStates[sortedExportProcessStates.length - 1];

  if (isSuccessfulExport(latestExportProcessState)) {
    return <DownloadModelButton downloadUrl={latestExportProcessState.downloadUrl} />;
  }
  return <ExportProcessStateIcon exportProcessState={latestExportProcessState} />;
}

export default ExportStateCellContent;
