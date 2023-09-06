import {
  SnackbarProvider as SNACKBAR_PROVIDER,
  SnackbarProviderProps as _SnackbarProviderProps,
  useSnackbar,
  SnackbarKey,
  MaterialDesignContent
} from 'notistack';
import {ReactNode} from 'react';
import {IconButton, styled} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import * as React from 'react';

const uniqueId = "bade4e92-baed-40f8-a098-0e745563e786"
export const DATA_TEST_ID = {
  SNACKBAR_CLOSE_BUTTON: `snackbar-close-button-${uniqueId}`
}

const SnackbarCloseButton = (key: SnackbarKey) => {
  const {closeSnackbar} = useSnackbar();
  // Currently due to a bug in the notistack library, we cannot ref to the correct ARIA ids (see https://github.com/iamhosseindhv/notistack/issues/579)
  // Suing  the title attribute for accessibility, is not ideal. When multiple snackbars are open,
  // the title will be the same for all of them violating the WAG2A rule of unique id. See https://tabiya-tech.atlassian.net/browse/PLAT-129
  return <IconButton title={"Close notification"} data-testid={DATA_TEST_ID.SNACKBAR_CLOSE_BUTTON}
                     onClick={() => closeSnackbar(key)}>
    <CloseIcon color="action"/>
  </IconButton>;
}

interface SnackbarProviderProps {
  children: ReactNode;
}

const StyledMaterialDesignContent = styled(MaterialDesignContent)(({theme}) => ({
  '&.notistack-MuiContent-success': {
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.fontSize
  },
  '&.notistack-MuiContent-error': {
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.fontSize
  },
  '&.notistack-MuiContent-warning': {
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.fontSize
  },
}));

const SnackbarProvider: React.FC<SnackbarProviderProps & _SnackbarProviderProps> = ({children, ...props}) => {
  const notistackOptions: _SnackbarProviderProps = {
    maxSnack: 10,
    autoHideDuration: null,
    transitionDuration: {enter: 500, exit: 500},
    anchorOrigin: {
      vertical: 'top',
      horizontal: 'right',
    },
    Components: {
      success: StyledMaterialDesignContent,
      error: StyledMaterialDesignContent,
      warning: StyledMaterialDesignContent,
    },
    ...props
  };

  return (
    <SNACKBAR_PROVIDER {...notistackOptions} action={SnackbarCloseButton}>
      {children}
    </SNACKBAR_PROVIDER>
  );
};

export default SnackbarProvider;
export {useSnackbar};
export type {VariantType} from 'notistack';
