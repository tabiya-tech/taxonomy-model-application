import { HashRouter, Route, Routes } from "react-router-dom";
import routerConfig from "./routerConfig";
import { AppLayout } from "./components";

export const TaxonomyModelApp = () => {
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
