// custom Backdrop component
import { Backdrop as OriginalBackdrop, CircularProgress, Grid, Typography, useTheme } from "@mui/material";
import Paper from "@mui/material/Paper";
import React from "react";
import { Sloth } from "src/theme/Sloth/Sloth";

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
    <OriginalBackdrop
      sx={{ zIndex: theme.zIndex.drawer + 1 }}
      data-testid={DATA_TEST_ID.BACKDROP_CONTAINER}
      open={props.isShown}
    >
      <Sloth width={"64px"}>
        <Paper
          elevation={24}
          sx={{
            backgroundColor: "containerBackground.main",
          }}
        >
          <Grid
            flexDirection={"row"}
            height={"auto"}
            width={"auto"}
            container
            justifyContent="center"
            alignItems="center"
            padding={theme.spacing(theme.tabiyaSpacing.md)}
          >
            {props.message && (
              <Grid item>
                <Typography
                  variant="h6"
                  color="info.contrastText"
                  data-testid={DATA_TEST_ID.MESSAGE_ELEMENT}
                  sx={{
                    paddingRight: theme.spacing(theme.tabiyaSpacing.md),
                    wordWrap: "break-word",
                    textAlign: "center", // Align the text in the center
                  }}
                >
                  {props.message}
                </Typography>
              </Grid>
            )}
            <Grid style={{ lineHeight: 0 }} item>
              <CircularProgress
                sx={{ color: (theme) => theme.palette.info.contrastText }}
                size={2 * theme.typography.fontSize}
                data-testid={DATA_TEST_ID.PROGRESS_ELEMENT}
              />
            </Grid>
          </Grid>
        </Paper>
      </Sloth>
    </OriginalBackdrop>
  );
};
