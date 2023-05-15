import Info from "./info/Info";
import ImportModal, {DATA_TEST_ID} from "./import/ImportModel";

export const routerPaths = {
  ROOT:"/",
  INFO:"/info",
  IMPORT:"/import"
}

export const routerConfig = [
  {
    path: routerPaths.ROOT,
    element: <div data-testid={DATA_TEST_ID.WELCOME_PAGE_ROOT}>Welcome Page</div>,
    errorElement: <div>Sorry something went wrong</div>,
  },
  {
    path: routerPaths.INFO,
    element: <Info/>,
    errorElement: <div>Sorry info got wrong</div>
  },
  {
    path: routerPaths.IMPORT,
    element: <ImportModal/>,
    errorElement: <div>Sorry upload got wrong</div>
  }
];

export default routerConfig;