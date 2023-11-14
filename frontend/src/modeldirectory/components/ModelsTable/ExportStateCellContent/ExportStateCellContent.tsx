import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import { DownloadModelButton } from "src/modeldirectory/components/DownloadModelButton/DownloadModelButton";
import ExportProcessStateIcon from "src/modeldirectory/components/ExportProcessStateIcon/ExportProcessStateIcon";
import ExportProcessStateAPISpecs from "api-specifications/exportProcessState";
import * as React from "react";

function canDownload(model: ModelInfoTypes.ModelInfo): boolean {
  // Can download only if the last export was successful and there were no errors or warnings
  return (
    model.exportProcessState.length > 0 &&
    model.exportProcessState[0].status === ExportProcessStateAPISpecs.Enums.Status.COMPLETED &&
    !model.exportProcessState[0].result.errored &&
    !model.exportProcessState[0].result.exportErrors &&
    !model.exportProcessState[0].result.exportWarnings
  );
}

function hasExportProcessState(model: ModelInfoTypes.ModelInfo): boolean {
  return model.exportProcessState.length > 0;
}

interface ExportStateCellProps {
  model: ModelInfoTypes.ModelInfo;
}

const uniqueId = "fe7db48f-9846-478f-b3e0-b299fb30775e";
export const DATA_TEST_ID = {
  EMPTY_DIV: `empty-div-${uniqueId}`,
};

export function ExportStateCellContent(props: Readonly<ExportStateCellProps>) {
  if (canDownload(props.model)) {
    return <DownloadModelButton downloadUrl={props.model.exportProcessState[0].downloadUrl} />;
  }
  if (hasExportProcessState(props.model)) {
    return <ExportProcessStateIcon exportProcessState={props.model.exportProcessState[0]} />;
  }
  return <div data-testid={DATA_TEST_ID.EMPTY_DIV} />;
}

export default ExportStateCellContent;
