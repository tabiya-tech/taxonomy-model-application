import React, { useContext, useEffect, useRef } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import routerConfig from "./routerConfig";
import { AppLayout } from "./components";
import { useSnackbar } from "src/theme/SnackbarProvider/SnackbarProvider";
import { AuthProvider, IsOnlineContext } from "./providers";

const uniqueId = "8490f1cc-0786-476f-821e-34b6b712d63f";

export const SNACKBAR_KEYS = {
  OFFLINE_ERROR: `offline-error-${uniqueId}`,
  ONLINE_SUCCESS: `online-success-${uniqueId}`,
};

export const SNACKBAR_AUTO_HIDE_DURATION = 3000;
export const TaxonomyModelApp = () => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const currentIsOnline = useContext(IsOnlineContext);

  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current++;
    // if currently online and initial render, then don't show notification
    if (currentIsOnline && renderCount.current === 1) {
      return;
    }

    if (!currentIsOnline) {
      // offline
      closeSnackbar(SNACKBAR_KEYS.ONLINE_SUCCESS);
      enqueueSnackbar(`You are offline`, {
        variant: "warning",
        key: SNACKBAR_KEYS.OFFLINE_ERROR,
        preventDuplicate: true,
        persist: true,
        action: [],
      });
    } else {
      // online
      closeSnackbar(SNACKBAR_KEYS.OFFLINE_ERROR);
      enqueueSnackbar(`You are back online`, {
        variant: "success",
        key: SNACKBAR_KEYS.ONLINE_SUCCESS,
        preventDuplicate: true,
        autoHideDuration: SNACKBAR_AUTO_HIDE_DURATION,
      });
    }
  }, [currentIsOnline, closeSnackbar, enqueueSnackbar]);

  return (
    <HashRouter>
      <AuthProvider>
        <AppLayout>
          <Routes>
            {routerConfig.map((route) => (
              <Route key={route.path} path={route.path} element={route.element} errorElement={route.errorElement} />
            ))}
          </Routes>
        </AppLayout>
      </AuthProvider>
    </HashRouter>
  );
};

export default TaxonomyModelApp;
