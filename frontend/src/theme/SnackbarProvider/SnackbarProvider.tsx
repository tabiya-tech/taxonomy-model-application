import {
  SnackbarProvider as OriginalSnackbarProvider,
  SnackbarProviderProps as OriginalSnackbarProviderProps,
  useSnackbar,
  SnackbarKey,
  MaterialDesignContent,
} from "notistack";
import { IconButton, styled } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import * as React from "react";

const uniqueId = "bade4e92-baed-40f8-a098-0e745563e786";
export const DATA_TEST_ID = {
  SNACKBAR_CLOSE_BUTTON: `snackbar-close-button-${uniqueId}`,
};

const SnackbarCloseButton = (key: SnackbarKey) => {
  const { closeSnackbar } = useSnackbar();
  // Currently due to a bug in the notistack library, we cannot ref to the correct ARIA ids (see https://github.com/iamhosseindhv/notistack/issues/579)
  // Suing  the title attribute for accessibility, is not ideal. When multiple snackbars are open,
  // the title will be the same for all of them violating the WAG2A rule of unique id. See https://tabiya-tech.atlassian.net/browse/PLAT-129
  return (
    <IconButton
      title={"Close notification"}
      data-testid={DATA_TEST_ID.SNACKBAR_CLOSE_BUTTON}
      onClick={() => closeSnackbar(key)}
      sx={{
        margin: "0",
        padding: "0",
      }}
    >
      <CloseIcon
        sx={{
          margin: 0,
          padding: 0,
        }}
      />
    </IconButton>
  );
};

const StyledMaterialDesignContent = styled(MaterialDesignContent)(({ theme }) => ({
  "&.notistack-MuiContent": {
    // adjust the snackbar content to place the close button on the top right,
    // so that the button is not hidden in case multiple snackbars are open and overlap,
    // especially when the text is long
    display: "flex",
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "start",
    // ---
  },
  "&.notistack-MuiContent-success": {
    color: theme.palette.success.dark,
    backgroundColor: theme.palette.success.light,
    fontFamily: theme.typography.body1.fontFamily,
    fontSize: theme.typography.body1.fontSize,
    "& .MuiSvgIcon-root": {
      color: theme.palette.success.dark,
    },
  },
  "& #notistack-snackbar svg": {
    fontSize: theme.typography.h4.fontSize + "!important",
  },
  "&.notistack-MuiContent-error": {
    color: theme.palette.error.dark,
    backgroundColor: theme.palette.error.light,
    fontFamily: theme.typography.body1.fontFamily,
    fontSize: theme.typography.body1.fontSize,
    "& .MuiSvgIcon-root": {
      color: theme.palette.error.dark,
    },
  },
  "&.notistack-MuiContent-warning": {
    color: theme.palette.warning.dark,
    backgroundColor: theme.palette.warning.light,
    fontFamily: theme.typography.body1.fontFamily,
    fontSize: theme.typography.body1.fontSize,
    "& .MuiSvgIcon-root": {
      color: theme.palette.warning.dark,
    },
  },
  "&.notistack-MuiContent-info": {
    color: theme.palette.info.dark,
    backgroundColor: theme.palette.info.light,
    fontFamily: theme.typography.body1.fontFamily,
    fontSize: theme.typography.body1.fontSize,
    "& .MuiSvgIcon-root": {
      color: theme.palette.info.dark,
    },
  },
}));

const SnackbarProvider: React.FC<OriginalSnackbarProviderProps> = ({
  children,
  ...props
}: Readonly<OriginalSnackbarProviderProps>) => {
  const notistackOptions: OriginalSnackbarProviderProps = {
    maxSnack: 10,
    autoHideDuration: null,
    transitionDuration: { enter: 500, exit: 500 },
    anchorOrigin: {
      vertical: "top",
      horizontal: "right",
    },
    Components: {
      success: StyledMaterialDesignContent,
      error: StyledMaterialDesignContent,
      warning: StyledMaterialDesignContent,
      info: StyledMaterialDesignContent,
    },
    dense: false,
    style: {
      // limit the width of the snackbar so that long text is wrapped in multiple lines
      maxWidth: "600px",
      whiteSpace: "normal",
      // ---
    },
    ...props,
  };

  return (
    <OriginalSnackbarProvider {...notistackOptions} action={SnackbarCloseButton}>
      {children}
    </OriginalSnackbarProvider>
  );
};

export default SnackbarProvider;
export { useSnackbar };
export type { VariantType } from "notistack";
