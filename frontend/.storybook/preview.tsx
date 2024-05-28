import { CssBaseline, ThemeProvider } from "@mui/material";
import { BrowserRouter as Router } from "react-router-dom";
import { applicationTheme, ThemeMode } from "../src/theme/applicationTheme/applicationTheme";
// Load fonts
// The application font are typically loaded in the index.html, index.css or index.tsx file
// The fonts for the storybook are loaded here
// Since the fonts for the app are downloaded from a CDN in the index.css file
// we need to load them here as well
import "../src/index.css";
// Load the application theme css file here
import "../src/theme/applicationTheme/application-theme.css";
//If the application fonts are loaded from the index.tsx file via an import, then the fonts can be loaded here as well
/*
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
*/
import type { Preview } from "@storybook/react";
import CustomSnackbarProvider from "../src/theme/SnackbarProvider/SnackbarProvider";
import { IsOnlineProvider } from "../src/app/providers";
import { AuthContext, authContextDefaultValue } from "../src/auth/AuthProvider";

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
    a11y: {
      // Storybook will run the a11y tests on the element with this selector.
      // By default, a11y tests are run on the #storybook-root.
      // However, some modal or dialog components are not rendered as a child of the #storybook-root.
      // In such cases, the a11y tests will not be able to find the modal or dialog components.
      // The selector below will allow the a11y tests on the #storybook-root or the root element of the modal or dialog,
      // depending on which element is not hidden.
      // Unfortunately, the axe-core library does not support running a11y tests on multiple elements,
      // so it is important that the selector returns only one element.
      // An alternative to this would have been to use the `body` element to run the a11y tests on that,
      // but this does not work well because it reports false positives and false negatives.
      // The same selector is used in the `a11y` parameter in the `test-runner.tsx` file.
      element: '#storybook-root:not([aria-hidden="true"]), body > div[role="presentation"]',
    },
  },
  globalTypes: {
    userRole: {
      name: "User Role",
      description: "User role for preview",
      defaultValue: "anonymous",
      toolbar: {
        icon: "user",
        items: [
          { value: "anonymous", title: "Anonymous" },
          { value: "model-managers", title: "Model Manager" },
          { value: "registered-users", title: "Registered User" },
        ],
      },
    },
  },
};

export default preview;

export const decorators = [
  (Story, context) => {
    const userRole = context.globals.userRole;
    const authContextValue = {
      ...authContextDefaultValue,
      user: userRole === "anonymous" ? null : { username: "John Doe", roles: [userRole] },
      hasRole: (role: string) => role === userRole,
    };
    return (
      <Router>
        <CssBaseline />
        <IsOnlineProvider>
          <ThemeProvider theme={applicationTheme(ThemeMode.LIGHT)}>
            <CustomSnackbarProvider>
              <AuthContext.Provider value={authContextValue}>
                <div style={{ height: "100vh" }}>
                  <Story />
                </div>
              </AuthContext.Provider>
            </CustomSnackbarProvider>
          </ThemeProvider>
        </IsOnlineProvider>
      </Router>
    );
  },
];
