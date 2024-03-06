import React from "react";
import {VisualMock} from "src/_test_utilities/VisualMock";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";

interface ImportProcessStateContentProps {
  importProcessState: ModelInfoTypes.ImportProcessState;
}

const uniqueId = "333ab3d5-61a7-4169-8af9-01fe57ed5673";

export const DATA_TEST_ID = {
  IMPORT_STATUS_FIELD: `import-status-${uniqueId}`,
  IMPORT_DURATION_FIELD: `import-duration-${uniqueId}`,
};

export const FIELD_ID = {
  IMPORT_STATUS_FIELD: `import-status-${uniqueId}`,
  IMPORT_DURATION_FIELD: `import-duration-${uniqueId}`,
}

/**
 * ImportProcessStateContent is responsible for showing the import status and duration
 * @param props
 * @constructor
 */

const ImportProcessStateContent: React.FC<ImportProcessStateContentProps> = (
  props: Readonly<ImportProcessStateContentProps>
) => {
  return <VisualMock text="ImportProcessStateContent" />
};

export default ImportProcessStateContent;