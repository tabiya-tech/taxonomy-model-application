import { Box, Typography } from "@mui/material";
import React from "react";

export interface PropertyFieldLayoutProps {
  title: string;
  "data-testid"?: string;
  children: React.ReactNode;
  fieldId: string;
}

const uniqueId = "5abb0d55-4073-4f5b-8432-ee8c96aa4df2";
export const DATA_TEST_ID = {
  ITEM_TITLE: `item-title-${uniqueId}`,
};

const PropertyFieldLayout = (props: Readonly<PropertyFieldLayoutProps>) => {
  return (
    <Box data-testid={props["data-testid"]} display="flex" flexDirection="column" sx={{ width: "100%" }}>
      <Typography
        variant="h6"
        data-testid={DATA_TEST_ID.ITEM_TITLE}
        id={props.fieldId}
        tabIndex={0}
        sx={{
          width: "fit-content",
          outline: "none", // Removes the default focus outline
          borderBottom: "2px solid transparent", // Adds a transparent bottom border
          "&:focus-visible": {
            borderBottom: (theme) => `2px solid ${theme.palette.primary.main}`,
          },
        }}
      >
        {props.title}
      </Typography>
      <Box
        sx={{
          width: "100%",
          height: "100%",
          margin: (theme) => theme.tabiyaSpacing.none,
          padding: (theme) => theme.tabiyaSpacing.none,
          flex: "1",
          overflowY: "clip",
        }}
      >
        {props.children}
      </Box>
    </Box>
  );
};

export default PropertyFieldLayout;