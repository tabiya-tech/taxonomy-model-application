import Info from "src/info/Info";
import ModelDirectory from "src/modeldirectory/ModelDirectory";
import NotFound from "src/errorPage/NotFound";
import ModelSelectionPage from "src/explorer/ModelSelectionPage";
import ExplorerPage from "src/explorer/ExplorerPage";
import LandingPage from "src/landingPage/LandingPage";

import { routerPaths } from "src/app/routerPaths";

export const routerConfig = [
  {
    path: routerPaths.ROOT,
    element: <LandingPage />,
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
    path: routerPaths.EXPLORER,
    element: <ModelSelectionPage />,
    errorElement: <div>Sorry, the explorer could not be shown</div>,
  },
  {
    path: routerPaths.EXPLORER_OCCUPATIONS,
    element: <ExplorerPage initialTab="occupations" />,
    errorElement: <div>Sorry, the occupations could not be shown</div>,
  },
  {
    path: routerPaths.EXPLORER_OCCUPATIONS_DETAIL,
    element: <ExplorerPage initialTab="occupations" />,
    errorElement: <div>Sorry, the occupation could not be shown</div>,
  },
  {
    path: routerPaths.EXPLORER_SKILLS,
    element: <ExplorerPage initialTab="skills" />,
    errorElement: <div>Sorry, the skills could not be shown</div>,
  },
  {
    path: routerPaths.EXPLORER_SKILLS_DETAIL,
    element: <ExplorerPage initialTab="skills" />,
    errorElement: <div>Sorry, the skill could not be shown</div>,
  },
  {
    path: "*",
    element: <NotFound />,
    errorElement: <div>Sorry, something went wrong</div>,
  },
];

export default routerConfig;
