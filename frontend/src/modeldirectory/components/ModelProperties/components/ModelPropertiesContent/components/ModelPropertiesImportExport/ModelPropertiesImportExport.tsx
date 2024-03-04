import {ModelInfoTypes} from "src/modelInfo/modelInfoTypes";
import React from "react";
import {VisualMock} from "src/_test_utilities/VisualMock";

export interface ModelPropertiesImportExportProps {
  model: ModelInfoTypes.ModelInfo;
}

const uniqueId = "7804fa94-6151-4a64-8685-cdc3d845063c";

export const DATA_TEST_ID = {
  IMPORT_TIMELINE: `import-timeline-${uniqueId}`,
  EXPORT_TIMELINE: `export-timeline-${uniqueId}`,
  IMPORT_EXPORT_TAB: `import-export-tab-${uniqueId}`,
};

/**
 * ModelPropertiesImportExport is responsible for showing the import and export process state history of a model
 * in a timeline
 * @param props
 * @constructor
 */

const ModelPropertiesImportExport: React.FC<ModelPropertiesImportExportProps> = (
  props: Readonly<ModelPropertiesImportExportProps>
) => {
  return <VisualMock text="ModelPropertiesImportExport tab" />
};
