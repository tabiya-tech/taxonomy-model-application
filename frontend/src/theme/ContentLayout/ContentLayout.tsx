import React from "react";
import { Box, Grid } from "@mui/material";
import { motion } from "framer-motion";

const uniqueId = "14c01398-e7fc-4b09-8dcb-3195acdf120a";
export const DATA_TEST_ID = {
  CONTENT_LAYOUT: `content-layout-root-${uniqueId}`,
};

type ContentLayoutProps = {
  headerComponent: React.ReactNode;
  mainComponent: React.ReactNode;
  children?: React.ReactNode;
};

const ContentLayout = (props: Readonly<ContentLayoutProps>) => {
  return (
    <>
      <Grid
        spacing={0}
        container
        sx={{
          // It necessary to set the height to 100%, so that the Grid will take the height of the parent.
          // Otherwise, it will take the height of it's content. In case the children do not have enough content,
          // then they will not be stretched to the bottom of the page.
          // However, setting the height to 100%, will cause the page to scroll in case margins are added.
          // Setting the box-sizing to border-box, will not help.
          // This has to do how the Grid component works. In order to avoid this, we set the height: 100%,
          // and then we set the margin to 0, or height: "calc(100% - MarginTop - MarginBottom)".
          // The same for the width.
          width: (theme) => `calc(100% - 2 * ${theme.spacing(theme.tabiyaSpacing.none)})`,
          height: (theme) => `calc(100% - 2 * ${theme.spacing(theme.tabiyaSpacing.none)})`,
          overflowY: "clip",
          display: "flex",
          flex: "1",
          flexDirection: "column",
          alignItems: "center",
          justifyItems: "center",
          borderTopRightRadius: (theme) => theme.rounding(theme.tabiyaRounding.md),
          borderTopLeftRadius: (theme) => theme.rounding(theme.tabiyaRounding.md),
          margin: (theme) => theme.spacing(theme.tabiyaRounding.none), // setting the margin to other than 0, may cause the page to scroll in case margins are added
          paddingX: (theme) => theme.tabiyaSpacing.lg,
          backgroundColor: (theme) => theme.palette.containerBackground.light, //,"red",
        }}
        data-testid={DATA_TEST_ID.CONTENT_LAYOUT}
      >
        <motion.div
          initial={{ width: "100%", height: "100%", opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
        >
          <Box
            component={"div"}
            sx={{
              width: "100%",
              height: "100%",
              marginY: (theme) => theme.tabiyaSpacing.none,
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "start",
              backgroundColor: "none", //"blue", //
            }}
          >
            <Grid
              item
              sx={{
                width: "100%",
                margin: (theme) => theme.tabiyaSpacing.none,
                padding: (theme) => theme.tabiyaSpacing.none,
                paddingY: (theme) => theme.tabiyaSpacing.xl,
                backgroundColor: "none", //"green",//
              }}
            >
              {props.headerComponent}
            </Grid>
            <Grid
              item
              sx={{
                width: "100%",
                height: "100%",
                margin: (theme) => theme.tabiyaSpacing.none,
                padding: (theme) => theme.tabiyaSpacing.none,
                flex: "1",
                overflowY: "clip",
                backgroundColor: "none", //"magenta"
              }}
            >
              {props.mainComponent}
            </Grid>
          </Box>
        </motion.div>
      </Grid>
      {props.children}
    </>
  );
};
export default ContentLayout;
