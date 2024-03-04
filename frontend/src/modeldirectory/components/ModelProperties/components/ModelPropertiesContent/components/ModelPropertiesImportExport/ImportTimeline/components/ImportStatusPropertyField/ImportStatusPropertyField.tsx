import React from "react";
import {VisualMock} from "src/_test_utilities/VisualMock";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";

interface ImportStatusPropertyFieldProps {
  importProcessState: ModelInfoTypes.ImportProcessState;
  fieldId: string;
}

const uniqueId = "56ea04a0-f80e-4cd0-b967-eb55d108f1b6";

export const DATA_TEST_ID = {
  IMPORT_STATUS_FIELD: `status-${uniqueId}`,
};

/**
 * ImportStatusPropertyField is responsible for showing the import status
 * @param props
 * @constructor
 */

const ImportStatusPropertyField: React.FC<ImportStatusPropertyFieldProps> = (
  props: Readonly<ImportStatusPropertyFieldProps>
) => {
  return <VisualMock text="ImportStatusPropertyField" />
};
