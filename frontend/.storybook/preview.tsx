import { CssBaseline, ThemeProvider } from "@mui/material";
import { BrowserRouter as Router } from "react-router-dom";
import { applicationTheme, ThemeMode } from "../src/theme/applicationTheme";
// Load fonts
// The application font are typically loaded in the index.html, index.css or index.tsx file
// The fonts for the storybook are loaded here
// Since the fonts for the app are downloaded from a CDN in the index.css file
// we need to load them here as well
import "../src/index.css";
// Load the application theme css file here
import "../src/theme/application-theme.css"
//If the application fonts are loaded from the index.tsx file via an import, then the fonts can be loaded here as well
/*
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
*/
import type { Preview } from "@storybook/react";
import CustomSnackbarProvider from "../src/theme/SnackbarProvider/SnackbarProvider";

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    layout: "fullscreen",
  },
};

export default preview;

export const decorators = [
  (Story) => (
    <Router>
      <CssBaseline />
      <ThemeProvider theme={applicationTheme(ThemeMode.LIGHT)}>
        <CustomSnackbarProvider>
          <div style={{ height: "100vh" }}>
            <Story />
          </div>
        </CustomSnackbarProvider>
      </ThemeProvider>
    </Router>
  ),
];
