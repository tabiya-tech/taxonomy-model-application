import React from 'react';
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import { VisualMock } from "src/_test_utilities/VisualMock";

interface ExportProcessStateContentProps {
  exportProcessState: ModelInfoTypes.ExportProcessState;
}

/**
 * ExportProcessStateContent is responsible for showing the status and the duration of the export process
 */
const ExportProcessStateContent : React.FC<ExportProcessStateContentProps> = (props) => {
  return (<VisualMock text="ExportProcessStateContent" />);
};

export default ExportProcessStateContent;