import React from "react";
import { Typography } from "@mui/material";
import PropertyFieldLayout from "../PropertyFieldLayout";
import PublishedWithChangesIcon from "@mui/icons-material/PublishedWithChanges";
import UnpublishedOutlinedIcon from "@mui/icons-material/UnpublishedOutlined";
import Box from "@mui/material/Box";

export interface ReleasedPropertyFieldProps {
  released: boolean;
  "data-testid"?: string;
  fieldId: string;
}

const uniqueId = "7e51bcc0-7abc-462c-81e8-a33058fa1b1e";

export const DATA_TEST_ID = {
  RELEASED_PROPERTY_FIELD_STATUS: `released-property-field-status-${uniqueId}`,
  RELEASED_ICON: `released-icon-${uniqueId}`,
  NOT_RELEASED_ICON: `not-released-icon-${uniqueId}`,
  RELEASED_TEXT: `released-text-${uniqueId}`,
  NOT_RELEASED_TEXT: `not-released-text-${uniqueId}`,
};

export const TEXT = {
  RELEASED: "Released",
  NOT_RELEASED: "Not Released",
};

const ReleasedPropertyField = (props: Readonly<ReleasedPropertyFieldProps>) => {
  return (
    <PropertyFieldLayout title="Released Status" fieldId={props.fieldId} data-testid={props["data-testid"]}>
      <Box
        display="flex"
        gap={(theme) => theme.tabiyaSpacing.xs}
        alignItems="center"
        data-testid={DATA_TEST_ID.RELEASED_PROPERTY_FIELD_STATUS}
        aria-labelledby={props.fieldId}
        role="text"
      >
        {props.released ? (
          <>
            <PublishedWithChangesIcon
              sx={{ color: (theme) => theme.typography.body1.color }}
              data-testid={DATA_TEST_ID.RELEASED_ICON}
            />
            <Typography variant="body1" data-testid={DATA_TEST_ID.RELEASED_TEXT}>
              {TEXT.RELEASED}
            </Typography>
          </>
        ) : (
          <>
            <UnpublishedOutlinedIcon
              sx={{ color: (theme) => theme.typography.body1.color }}
              data-testid={DATA_TEST_ID.NOT_RELEASED_ICON}
            />
            <Typography variant="body1" data-testid={DATA_TEST_ID.NOT_RELEASED_TEXT}>
              {TEXT.NOT_RELEASED}
            </Typography>
          </>
        )}
      </Box>
    </PropertyFieldLayout>
  );
};

export default ReleasedPropertyField;
