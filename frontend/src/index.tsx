import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import TaxonomyModelApp from './TaxonomyModelApp';
import reportWebVitals from './reportWebVitals';
import applicationTheme from "./theme/applicationTheme";
import {ThemeProvider} from "@mui/material";

/*
// Currently the fonts are downloaded from google via the index.css
// Fonts could be distributed with the app by explicitly importing them
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
*/

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <ThemeProvider theme={applicationTheme}>
      <TaxonomyModelApp/>
    </ThemeProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
