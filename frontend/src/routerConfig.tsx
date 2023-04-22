import Info from "./info/Info";
import ImportModal from "./import/ImportModel";

export const routerConfig = [
  {
    path: "/",
    element: <div>Welcome Page</div>,
    errorElement: <div>Sorry something went wrong</div>,
  },
  {
    path: "/info",
    element: <Info/>,
    errorElement: <div>Sorry info got wrong</div>
  },
  {
    path: "/import",
    element: <ImportModal/>,
    errorElement: <div>Sorry upload got wrong</div>
  }
];

export default routerConfig;