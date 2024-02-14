import React from "react";
import { Box, useTheme } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import HeaderTitle from "src/theme/HeaderTitle/HeaderTitle";
import CustomIconButton from "src/theme/IconButton/CustomIconButton";

export interface ModelPropertiesHeaderProps {
  title: string;
  notifyOnClose: () => void;
}

const uniqueId = "a9f38045-7a8d-4226-88c6-8c9384516012";

export const DATA_TEST_ID = {
  MODEL_PROPERTIES_HEADER: `model-properties-header-${uniqueId}`,
  MODEL_PROPERTIES_HEADER_TITLE: `header-title-${uniqueId}`,
  MODEL_PROPERTIES_HEADER_CLOSE_BUTTON: `header-close-button-${uniqueId}`,
};

/**
 * ModelPropertiesHeader responsible for rendering the header of the model properties drawer
 * with a title and close button
 * @param props
 * @constructor
 */

const ModelPropertiesHeader: React.FC<ModelPropertiesHeaderProps> = (props: Readonly<ModelPropertiesHeaderProps>) => {
  const theme = useTheme();

  function handleOnClick() {
    try {
      props.notifyOnClose();
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <Box
      display="flex"
      justifyContent="space-between"
      flexDirection="row"
      flexWrap="nowrap"
      alignItems="start"
      width="100%"
      gap={theme.spacing(theme.tabiyaSpacing.xl)}
      data-testid={DATA_TEST_ID.MODEL_PROPERTIES_HEADER}
    >
      <HeaderTitle data-testid={DATA_TEST_ID.MODEL_PROPERTIES_HEADER_TITLE}>{props.title}</HeaderTitle>
      <CustomIconButton
        onClick={handleOnClick}
        title="Close model properties"
        data-testid={DATA_TEST_ID.MODEL_PROPERTIES_HEADER_CLOSE_BUTTON}
      >
        <CloseIcon />
      </CustomIconButton>
    </Box>
  );
};

export default ModelPropertiesHeader;
