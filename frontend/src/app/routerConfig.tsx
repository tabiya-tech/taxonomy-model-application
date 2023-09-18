import Info from '../info/Info';
import ModelDirectory from '../modeldirectory/ModelDirectory';

export const routerPaths = {
  ROOT: '/',
  EXPLORE: '/explore',
  EDIT: '/edit',
  SETTINGS: '/settings',
  USERS: '/users',
  MODEL_DIRECTORY: '/modeldirectory',
};

export const routerConfig = [
  {
    path: routerPaths.ROOT,
    element:<ModelDirectory />,
    errorElement: <div>Sorry, something went wrong</div>,
  },
  {
    path: routerPaths.EXPLORE,
    element: <div>Coming soon, exploring the model</div>,
    errorElement: <div>Sorry, exploring the model could not be shown</div>,
  },
  {
    path: routerPaths.EDIT,
    element: <div>Coming soon, editing the model</div>,
    errorElement: <div>Sorry, editing the model could not be shown</div>,
  },
  {
    path: routerPaths.USERS,
    element: <div>Coming soon, the application users</div>,
    errorElement: <div>Sorry, application users could be shown</div>,
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
];

export default routerConfig;
