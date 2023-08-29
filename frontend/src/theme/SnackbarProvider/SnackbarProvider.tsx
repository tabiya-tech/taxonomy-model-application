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
  return <IconButton data-testid={DATA_TEST_ID.SNACKBAR_CLOSE_BUTTON} onClick={() => closeSnackbar(key)}>
    <CloseIcon style={{color: 'white', fontSize: '14px'}}/>
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
    }
  };

  return (
    <SNACKBAR_PROVIDER {...notistackOptions} {...props as SnackbarProviderProps} action={SnackbarCloseButton}>
      {children}
    </SNACKBAR_PROVIDER>
  );
};

export default SnackbarProvider;
export {useSnackbar};
export type {VariantType} from 'notistack';
