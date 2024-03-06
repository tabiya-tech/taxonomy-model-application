import React from 'react';
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import { VisualMock } from "src/_test_utilities/VisualMock";

interface ExportStatusPropertyFieldProps {
  exportProcessState: ModelInfoTypes.ExportProcessState;
  fieldId: string;
}

/**
 * ExportStatusPropertyField is responsible for showing the export status and its icon representation
 */
const ExportStatusPropertyField: React.FC<ExportStatusPropertyFieldProps> = () => {
  return (<VisualMock text="ExportStatusPropertyField" />);
};

export default ExportStatusPropertyField;