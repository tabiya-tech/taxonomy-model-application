import React from "react";
import { VisualMock } from "src/_test_utilities/VisualMock";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";

interface ImportStatusPropertyFieldProps {
  importProcessState: ModelInfoTypes.ImportProcessState;
  fieldId: string;
  "data-testid"?: string;
}

/**
 * ImportStatusPropertyField is responsible for showing the import status
 * @param props
 * @constructor
 */

const ImportStatusPropertyField: React.FC<ImportStatusPropertyFieldProps> = (
  props: Readonly<ImportStatusPropertyFieldProps>
) => {
  return <VisualMock text="ImportStatusPropertyField" />;
};

export default ImportStatusPropertyField;
