import React from 'react';
import {createHashRouter, RouterProvider} from 'react-router-dom';

import routerConfig from './routerConfig';
import {Container} from "@mui/material";

const router = createHashRouter(routerConfig);

function TaxonomyModelApp() {
  return (
    <Container sx={{
      height: '100vh',
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }} data-testid={"TaxonomyModelApp"}>
      <RouterProvider
        router={router}
        fallbackElement={<div>Something is out of place</div>}
      />
    </Container>
  );
}

export default TaxonomyModelApp;
