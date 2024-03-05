import React from "react";

import {ModelInfoTypes} from "src/modelInfo/modelInfoTypes";
import PropertyFieldLayout from "src/theme/PropertyFieldLayout/PropertyFieldLayout";
import {MESSAGE_TYPES, useStatusField} from "./hooks/useStatusField";
import Box from "@mui/material/Box";
import {Typography, useTheme} from "@mui/material";
import ImportProcessStateIcon from "src/modeldirectory/components/ImportProcessStateIcon/ImportProcessStateIcon";
import HelpTip from "src/theme/HelpTip/HelpTip";

interface ImportStatusPropertyFieldProps {
  importProcessState: ModelInfoTypes.ImportProcessState;
  fieldId: string;
}

export const uniqueId = "56ea04a0-f80e-4cd0-b967-eb55d108f1b6";

export const DATA_TEST_ID = {
  IMPORT_STATUS_FIELD: `status-${uniqueId}`,
};

/**
 * ImportStatusPropertyField is responsible for showing the import status
 * @param props
 * @constructor
 */

const FIELD_ID = {
  IMPORT_STATUS_FIELD: `created-${uniqueId}`,
};

const ImportStatusPropertyField: React.FC<ImportStatusPropertyFieldProps> = (
  props: Readonly<ImportStatusPropertyFieldProps>
) => {
  const theme = useTheme();
  const { messages } = useStatusField({ state: props.importProcessState })
  return (
    <PropertyFieldLayout
      title={"Status"}
      fieldId={FIELD_ID.IMPORT_STATUS_FIELD}
      data-testid={DATA_TEST_ID.IMPORT_STATUS_FIELD}
    >
      <Box display={"flex"} flexDirection={"row"} alignItems={"center"} gap={theme.spacing(1)}>
        <ImportProcessStateIcon importProcessState={props.importProcessState} />
        {messages.map((message, key) => {
          if(message.type === MESSAGE_TYPES.MESSAGE) {
            return (
              <Typography key={key}>
                {message.text}
              </Typography>
            )
          } else {
            return (
              <HelpTip key={key}>
                {message.text}
              </HelpTip>
            )
          }
        })}
      </Box>
    </PropertyFieldLayout>
  )
};

export default ImportStatusPropertyField
