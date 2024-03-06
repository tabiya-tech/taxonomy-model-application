import { useTheme } from "@mui/material";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import React from "react";
import Box from "@mui/material/Box";
import ImportStatusPropertyField from "../ImportStatusPropertyField/ImportStatusPropertyField";
import DurationPropertyField from "src/theme/PropertyFieldLayout/DurationPropertyField/DurationPropertyField";

interface ImportProcessStateContentProps {
  importProcessState: ModelInfoTypes.ImportProcessState;
}

const uniqueId = "333ab3d5-61a7-4169-8af9-01fe57ed5673";

export const DATA_TEST_ID = {
  IMPORT_PROCESS_STATE_CONTENT: `import-process-state-content-${uniqueId}`,
  IMPORT_STATUS_FIELD: `import-status-${uniqueId}`,
  IMPORT_DURATION_FIELD: `import-duration-${uniqueId}`,
};

export const FIELD_ID = {
  IMPORT_STATUS_FIELD: `import-status-${uniqueId}`,
  IMPORT_DURATION_FIELD: `import-duration-${uniqueId}`,
};

/**
 * ImportProcessStateContent is responsible for showing the import status and duration
 * @param props
 * @constructor
 */

const ImportProcessStateContent: React.FC<ImportProcessStateContentProps> = (
  props: Readonly<ImportProcessStateContentProps>
) => {
  const theme = useTheme();

  return (
    <Box
      display="flex"
      flexDirection="column"
      gap={theme.tabiyaSpacing.md}
      paddingY={theme.tabiyaSpacing.lg}
      data-testid={DATA_TEST_ID.IMPORT_PROCESS_STATE_CONTENT}
    >
      <ImportStatusPropertyField
        importProcessState={props.importProcessState}
        fieldId={FIELD_ID.IMPORT_STATUS_FIELD}
        data-testid={DATA_TEST_ID.IMPORT_STATUS_FIELD}
      />
      <DurationPropertyField
        label="Duration"
        firstDate={props.importProcessState.createdAt ? props.importProcessState.createdAt : new Date()}
        secondDate={props.importProcessState.updatedAt}
        fieldId={FIELD_ID.IMPORT_DURATION_FIELD}
        data-testid={DATA_TEST_ID.IMPORT_DURATION_FIELD}
      />
    </Box>
  );
};

export default ImportProcessStateContent;
