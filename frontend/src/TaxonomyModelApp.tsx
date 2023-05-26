import React from 'react';
import {createHashRouter, RouterProvider} from 'react-router-dom';

import routerConfig from './routerConfig';

const router = createHashRouter(routerConfig);


function TaxonomyModelApp() {
  return (
    <div className="TaxonomyModelApp" data-testid={"TaxonomyModelApp"}>
       <RouterProvider
        router={router}
        fallbackElement={<div>Something is out of place</div>}
      />
    </div>
  );
}

export default TaxonomyModelApp;
