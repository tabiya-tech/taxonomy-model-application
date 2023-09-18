import Info from '../info/Info';
import ModelDirectory from '../modeldirectory/ModelDirectory';

export const routerPaths = {
  ROOT: '/',
  INFO: '/info',
  MODEL_DIRECTORY: '/modeldirectory',
};
const uniqueId = '37d307ae-4f1e-4d8d-bafe-fd642f8af4dc';
export const DATA_TEST_ID = {
  LANDING_PAGE: `landing-page-root${uniqueId}`,
};

export const routerConfig = [
  {
    path: routerPaths.ROOT,
    element: (
      <div data-testid={DATA_TEST_ID.LANDING_PAGE}>
        Welcome Page
      </div>
    ),
    errorElement: <div>Sorry something went wrong</div>,
  },
  {
    path: routerPaths.INFO,
    element: <Info />,
    errorElement: <div>Sorry info got wrong</div>,
  },
  {
    path: routerPaths.MODEL_DIRECTORY,
    element: <ModelDirectory />,
    errorElement: <div>Sorry upload got wrong</div>,
  },
];

export default routerConfig;
