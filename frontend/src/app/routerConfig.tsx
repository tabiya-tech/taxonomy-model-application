import Info from "src/info/Info";
import ModelDirectory from "src/modeldirectory/ModelDirectory";
import NotFound from "src/errorPage/NotFound";
import Explorer from "src/explorer/Explorer";
import OccupationsExplorer from "src/explorer/OccupationsExplorer/OccupationsExplorer";
import SkillsExplorer from "src/explorer/SkillsExplorer/SkillsExplorer";
import { Navigate } from "react-router-dom";

export const routerPaths = {
  ROOT: "/",
  SETTINGS: "/settings",
  MODEL_DIRECTORY: "/modeldirectory",
  EXPLORER: "/explorer",
  EXPLORER_OCCUPATIONS: "/explorer/:modelId/occupations",
  EXPLORER_OCCUPATIONS_DETAIL: "/explorer/:modelId/occupations/:occupationId",
  EXPLORER_SKILLS: "/explorer/:modelId/skills",
  EXPLORER_SKILLS_DETAIL: "/explorer/:modelId/skills/:skillId",
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
    path: routerPaths.EXPLORER,
    element: <Explorer />,
    errorElement: <div>Sorry, the explorer could not be shown</div>,
  },
  {
    path: routerPaths.EXPLORER_OCCUPATIONS,
    element: <OccupationsExplorer />,
    errorElement: <div>Sorry, the occupations could not be shown</div>,
  },
  {
    path: routerPaths.EXPLORER_OCCUPATIONS_DETAIL,
    element: <OccupationsExplorer />,
    errorElement: <div>Sorry, the occupation could not be shown</div>,
  },
  {
    path: routerPaths.EXPLORER_SKILLS,
    element: <SkillsExplorer />,
    errorElement: <div>Sorry, the skills could not be shown</div>,
  },
  {
    path: routerPaths.EXPLORER_SKILLS_DETAIL,
    element: <SkillsExplorer />,
    errorElement: <div>Sorry, the skill could not be shown</div>,
  },
  {
    path: "*",
    element: <NotFound />,
    errorElement: <div>Sorry, something went wrong</div>,
  },
];

export default routerConfig;
