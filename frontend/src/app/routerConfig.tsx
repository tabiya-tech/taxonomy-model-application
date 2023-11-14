import Info from "src/info/Info";
import ModelDirectory from "src/modeldirectory/ModelDirectory";
import NotFound from "src/errorPage/NotFound";
import { Navigate } from "react-router-dom";

export const routerPaths = {
  ROOT: "/",
  SETTINGS: "/settings",
  MODEL_DIRECTORY: "/modeldirectory",
};

export const routerConfig = [
  {
    path: routerPaths.ROOT,
    element: <Navigate to={routerPaths.MODEL_DIRECTORY} />,
    errorElement: <div>Sorry, something went wrong</div>,
  },
  {
    path: routerPaths.SETTINGS,
    element: <Info />,
    errorElement: <div>Sorry, application settings could be shown</div>,
  },
  {
    path: routerPaths.MODEL_DIRECTORY,
    element: <ModelDirectory />,
    errorElement: <div>Sorry, model directory could not be shown</div>,
  },
  {
    path: "*",
    element: <NotFound />,
    errorElement: <div>Sorry, something went wrong</div>,
  },
];

export default routerConfig;
