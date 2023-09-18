import {
  HashRouter,
  Route,
  Routes,
} from 'react-router-dom';
import routerConfig from './routerConfig';
import { Container } from '@mui/material';
import { AppLayoutProvider } from './AppLayoutProvider';


export const TaxonomyModelApp = () => {
  return (
    <Container
      sx={{
        height: '100vh',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
      data-testid={'TaxonomyModelApp'}
    >
      <HashRouter>
        <AppLayoutProvider>
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
        </AppLayoutProvider>
      </HashRouter>
    </Container>
  );
};

export default TaxonomyModelApp;
