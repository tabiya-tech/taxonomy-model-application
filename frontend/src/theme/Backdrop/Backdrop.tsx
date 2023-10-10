// custom Backdrop component

import { Backdrop as BACKDROP, CircularProgress, Grid, Typography, useTheme } from "@mui/material";

interface IBackdropProps {
  isShown: boolean;
  message?: string;
}

const uniqueId = "91b57774-d50c-4350-882d-363f80ac10e8";

export const DATA_TEST_ID = {
  BACKDROP_CONTAINER: `backdrop-${uniqueId}`,
  PROGRESS_ELEMENT: `progress-${uniqueId}`,
  MESSAGE_ELEMENT: `message-${uniqueId}`,
};
export const Backdrop = (props: Readonly<IBackdropProps>) => {
  const theme = useTheme();
  return (
    <BACKDROP
      sx={{ color: "#fff", zIndex: theme.zIndex.drawer + 1 }}
      data-testid={DATA_TEST_ID.BACKDROP_CONTAINER}
      open={props.isShown}
    >
      <Grid container justifyContent="center" alignItems="center">
        {props.message && (
          <Grid item>
            <Typography
              data-testid={DATA_TEST_ID.MESSAGE_ELEMENT}
              sx={{
                wordWrap: "break-word",
                textAlign: "center", // Align the text in the center
              }}
            >
              {props.message}
            </Typography>
          </Grid>
        )}
        <Grid item>
          <CircularProgress
            color="inherit"
            size={2 * theme.typography.fontSize}
            data-testid={DATA_TEST_ID.PROGRESS_ELEMENT}
          />
        </Grid>
      </Grid>
    </BACKDROP>
  );
};
