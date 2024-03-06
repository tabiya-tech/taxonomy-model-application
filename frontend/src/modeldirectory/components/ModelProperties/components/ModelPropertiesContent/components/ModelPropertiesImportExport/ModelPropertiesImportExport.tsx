import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import { useTheme } from "@mui/material";
import React from "react";
import Box from "@mui/material/Box";
import ImportTimeline from "./ImportTimeline/ImportTimeline";
import PropertyFieldLayout from "src/theme/PropertyFieldLayout/PropertyFieldLayout";
import ExportTimeline from "./ExportTimeline/ExportTimeline";

export interface ModelPropertiesImportExportProps {
  model: ModelInfoTypes.ModelInfo;
}

const uniqueId = "7804fa94-6151-4a64-8685-cdc3d845063c";

export const DATA_TEST_ID = {
  IMPORT_EXPORT_TAB: `import-export-tab-${uniqueId}`,
};

export const FIELD_ID = {
  IMPORT_FIELD: `import-${uniqueId}`,
  EXPORT_FIELD: `export-${uniqueId}`,
};

/**
 * ModelPropertiesImportExport is responsible for showing the import and export process state history of a model in a timeline
 * @param props
 * @constructor
 */

const ModelPropertiesImportExport: React.FC<ModelPropertiesImportExportProps> = (
  props: Readonly<ModelPropertiesImportExportProps>
) => {
  const theme = useTheme();

  return (
    <Box
      display="flex"
      flexDirection="column"
      gap={theme.tabiyaSpacing.md}
      data-testid={DATA_TEST_ID.IMPORT_EXPORT_TAB}
    >
      <PropertyFieldLayout title="Export" fieldId={FIELD_ID.EXPORT_FIELD}>
        <ExportTimeline exportProcessStates={props.model.exportProcessState} />
      </PropertyFieldLayout>
      <PropertyFieldLayout title="Import" fieldId={FIELD_ID.IMPORT_FIELD}>
        <ImportTimeline importProcessState={props.model.importProcessState} />
      </PropertyFieldLayout>
    </Box>
  );
};

export default ModelPropertiesImportExport;
