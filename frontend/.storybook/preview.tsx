import { withThemeFromJSXProvider } from "@storybook/addon-styling";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { BrowserRouter as Router } from "react-router-dom";
import applicationsTheme, { ThemeMode } from "../src/theme/applicationTheme";
// Load fonts
// The application font are typically loaded in the index.html, index.css or index.tsx file
// The fonts for the storybook are loaded here
// Since the fonts for the app are downloaded from a CDN in the index.css file
// we need to load them here as well
import "../src/index.css";
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
  },
};

export default preview;

export const decorators = [
  withThemeFromJSXProvider({
    themes: {
      applicationsTheme: applicationsTheme(ThemeMode.LIGHT)
    },
    defaultTheme: "applicationsTheme",
    Provider: ThemeProvider,
    GlobalStyles: CssBaseline,
  }),(Story) => (
    <Router>
      <CustomSnackbarProvider>
        <Story />
      </CustomSnackbarProvider>
    </Router>
  ),
];