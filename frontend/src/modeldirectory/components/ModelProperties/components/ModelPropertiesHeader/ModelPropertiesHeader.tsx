import React from "react";
import { Box, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import HeaderTitle from "src/theme/HeaderTitle/HeaderTitle";
import CustomIconButton from "src/theme/IconButton/CustomIconButton";

export interface ModelPropertiesHeaderProps {
  name: string;
  notifyOnClose: () => void;
}

const uniqueId = "a9f38045-7a8d-4226-88c6-8c9384516012";

export const DATA_TEST_ID = {
  MODEL_PROPERTIES_HEADER: `model-properties-header-${uniqueId}`,
  MODEL_PROPERTIES_HEADER_TITLE: `header-title-${uniqueId}`,
  MODEL_PROPERTIES_MODEL_NAME: `model-name-${uniqueId}`,
  MODEL_PROPERTIES_HEADER_CLOSE_BUTTON: `header-close-button-${uniqueId}`,
};

/**
 * ModelPropertiesHeader responsible for rendering the header of the model properties drawer
 * with a title and close button
 * @param props
 * @constructor
 */

const ModelPropertiesHeader: React.FC<ModelPropertiesHeaderProps> = (props: Readonly<ModelPropertiesHeaderProps>) => {
  function handleOnClick() {
    try {
      props.notifyOnClose();
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <Box display="flex" flexDirection="column" data-testid={DATA_TEST_ID.MODEL_PROPERTIES_HEADER}>
      <Box display="flex" justifyContent="space-between" flexDirection="row" alignItems="start" width="100%">
        <Box flex={1} minWidth={0}>
          <HeaderTitle data-testid={DATA_TEST_ID.MODEL_PROPERTIES_HEADER_TITLE}>Model Properties</HeaderTitle>
        </Box>
        <CustomIconButton
          onClick={handleOnClick}
          title="Close model properties"
          data-testid={DATA_TEST_ID.MODEL_PROPERTIES_HEADER_CLOSE_BUTTON}
        >
          <CloseIcon />
        </CustomIconButton>
      </Box>
      <Box
        flex={1}
        minWidth={0}
        sx={{
          display: "-webkit-box",
          WebkitLineClamp: "2",
          WebkitBoxOrient: "vertical",
          textOverflow: "ellipsis",
          wordWrap: "break-word",
          overflow: "hidden",
        }}
      >
        <Typography variant="subtitle1" data-testid={DATA_TEST_ID.MODEL_PROPERTIES_MODEL_NAME}>
          {props.name}
        </Typography>
      </Box>
    </Box>
  );
};

export default ModelPropertiesHeader;
