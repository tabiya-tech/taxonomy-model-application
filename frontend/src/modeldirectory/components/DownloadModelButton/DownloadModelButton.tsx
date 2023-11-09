import { IconButton, Typography } from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import * as React from "react";

const uniqueId = "1623572c-456c-419e-9201-3c4971406fe1";
export const DATA_TEST_ID = {
  DOWNLOAD_MODEL_BUTTON: `download-model-button-${uniqueId}`,
};

export interface DownloadModelButtonProps {
  downloadUrl: string;
}

export function DownloadModelButton(props: Readonly<DownloadModelButtonProps>) {
  return (
    <IconButton
      href={props.downloadUrl}
      download={props.downloadUrl}
      sx={{
        margin: 0,
        paddingY: (theme) => theme.tabiyaSpacing.xs,
        paddingX: (theme) => theme.tabiyaSpacing.xs,
        borderRadius: (theme) => theme.tabiyaRounding.sm,
      }}
      color={"primary"}
      title={"Download"}
      data-testid={DATA_TEST_ID.DOWNLOAD_MODEL_BUTTON}
    >
      <FileDownloadIcon sx={{ lineHeight: 0 }} />
      <Typography color={"primary"} variant="caption">
        Download
      </Typography>
    </IconButton>
  );
}
export default DownloadModelButton;
