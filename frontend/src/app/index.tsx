import {
  HashRouter,
  Route,
  Routes,
} from 'react-router-dom';
import routerConfig from './routerConfig';
import { AppLayoutProvider } from './AppLayoutProvider';
import { AppLayout } from './components';

export const TaxonomyModelApp = () => {
  return (
    <HashRouter>
      <AppLayoutProvider>
        <AppLayout data-testid={'TaxonomyModelApp'}>
          <Routes>
            {routerConfig.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={route.element}
                errorElement={route.errorElement}
              />
            ))}
          </Routes>
        </AppLayout>
      </AppLayoutProvider>
    </HashRouter>
  );
};

export default TaxonomyModelApp;
