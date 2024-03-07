import React from "react";
import { VisualMock } from "src/_test_utilities/VisualMock";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";

interface ExportProcessStateContentProps {
  exportProcessState: ModelInfoTypes.ExportProcessState;
}

const uniqueId = "e50b6e98-dd42-4e1b-b7c8-7a282f67b032";
export const DATA_TEST_ID = {
  EXPORT_PROCESS_STATE_CONTENT: `export-process-state-content-${uniqueId}`,
};

/**
 * ExportProcessStateContent is responsible for showing the export process status and the duration
 */
const ExportProcessStateContent: React.FC<ExportProcessStateContentProps> = () => {
  return <VisualMock text="ExportProcessStateContent" />;
};

export default ExportProcessStateContent;
