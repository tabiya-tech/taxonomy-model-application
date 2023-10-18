import { useEffect } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import routerConfig from "./routerConfig";
import { AppLayout } from "./components";
import { useSnackbar } from "src/theme/SnackbarProvider/SnackbarProvider";

const uniqueId = "8490f1cc-0786-476f-821e-34b6b712d63f";

export const SNACKBAR_KEYS = {
  OFFLINE_ERROR: `offline-error-${uniqueId}`,
};

export const TaxonomyModelApp = () => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  useEffect(() => {
    const handleOnline = () => {
      closeSnackbar(SNACKBAR_KEYS.OFFLINE_ERROR);
    };

    const handleOffline = () => {
      enqueueSnackbar(`You are offline`, {
        variant: "warning",
        key: SNACKBAR_KEYS.OFFLINE_ERROR,
        preventDuplicate: true,
        persist: true,
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  });

  return (
    <HashRouter>
      <AppLayout>
        <Routes>
          {routerConfig.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} errorElement={route.errorElement} />
          ))}
        </Routes>
      </AppLayout>
    </HashRouter>
  );
};

export default TaxonomyModelApp;
