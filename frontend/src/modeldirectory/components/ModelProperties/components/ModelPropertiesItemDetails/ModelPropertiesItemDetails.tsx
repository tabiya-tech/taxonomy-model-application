import { Box, Typography } from "@mui/material";
import React from "react";
import { useSnackbar } from "src/theme/SnackbarProvider/SnackbarProvider";
import CustomIconButton from "src/theme/IconButton/CustomIconButton";
import { ContentCopy } from "@mui/icons-material";

export interface ModelPropertiesItemDetailsProps {
  title: string;
  value: string;
  isCopyEnabled?: boolean;
  "data-testid"?: string;
}

const uniqueId = "5abb0d55-4073-4f5b-8432-ee8c96aa4df2";
export const DATA_TEST_ID = {
  ITEM_TITLE: `item-title-${uniqueId}`,
  ITEM_VALUE: `item-value-${uniqueId}`,
  ITEM_COPY_BUTTON: `item-copy-button-${uniqueId}`,
};

const ModelPropertiesItemDetails = (props: Readonly<ModelPropertiesItemDetailsProps>) => {
  const { enqueueSnackbar } = useSnackbar();
  const handleCopyToClipboard = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    navigator.clipboard.writeText(props.value).then(() => {
      enqueueSnackbar("Copied to clipboard", { variant: "success", preventDuplicate: true });
    });
  };

  return (
    <Box data-testid={props["data-testid"]} display="flex" flexDirection="column" sx={{ width: "100%" }}>
      <Typography variant="h6" data-testid={DATA_TEST_ID.ITEM_TITLE} tabIndex={0}>
        {props.title}
      </Typography>
      <Box display="flex" flexDirection="row" alignItems={"flex-start"} justifyContent={"space-between"}>
        <Typography
          variant="body1"
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          data-testid={DATA_TEST_ID.ITEM_VALUE}
        >
          {props.value}
        </Typography>
        <Box>
          {props.isCopyEnabled && (
            <CustomIconButton
              onClick={handleCopyToClipboard}
              title={`Copy ${props.title} to clipboard`}
              data-testid={DATA_TEST_ID.ITEM_COPY_BUTTON}
              sx={{ padding: (theme) => theme.tabiyaSpacing.xs }}
            >
              <ContentCopy />
            </CustomIconButton>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default ModelPropertiesItemDetails;
