// mute the console
import "src/_test_utilities/consoleMock";

import { render, screen, within } from "@testing-library/react";

// mock the react-dom/client
// Using jest.doMock() so that the render function can be accessed from within the mock
jest.doMock("react-dom/client", () => {
  const ReactDOMMock = {
    createRoot: jest.fn().mockImplementation(() => {
      return {
        render: jest.fn().mockImplementation((component) => {
          render(component);
        }),
        unmount: jest.fn(),
      };
    }),
  };
  return {
    __esModule: true,
    default: ReactDOMMock,
  };
});

// mock TaxonomyModelApp
jest.mock("./app/index", () => {
  const mTaxonomyModelApp = () => (
    <div id="tabiya-app-id" data-testid="tabiya-app-id">
      Mock TaxonomyModelApp
    </div>
  );
  return {
    __esModule: true,
    default: mTaxonomyModelApp,
  };
});

// mock SnackbarProvider
jest.mock("./theme/SnackbarProvider/SnackbarProvider", () => {
  const mSnackbarProvider = jest
    .fn()
    .mockImplementation(({ children }) => <div data-testid="snackbar-provider-id">{children}</div>);
  return {
    __esModule: true,
    default: mSnackbarProvider,
  };
});

//mock Material UI ThemeProvider
jest.mock("@mui/material", () => {
  const mThemeProvider = jest
    .fn()
    .mockImplementation(({ children }) => <div data-testid="theme-provider-id">{children}</div>);
  const mCssBaseline = () => <div data-testid="css-baseline-id">Mock CssBaseline</div>;
  return {
    __esModule: true,
    ThemeProvider: mThemeProvider,
    CssBaseline: mCssBaseline,
  };
});

// mock isOnlineProvider, AuthProvider
jest.mock("src/app/providers/index.tsx", () => {
  const mIsOnlineProvider = jest
    .fn()
    .mockImplementation(({ children }) => <div data-testid="isonline-provider-id">{children}</div>);


  const mAuthProvider = jest
    .fn()
    .mockImplementation(({ children }) => <div data-testid="auth-provider-id">{children}</div>);
  return {
    __esModule: true,
    IsOnlineProvider: mIsOnlineProvider,
    AuthProvider: mAuthProvider,
  };
});


describe("test the application bootstrapping", () => {
  beforeEach(() => {
    (console.error as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();
  });

  it("should render the app", () => {
    jest.isolateModules(() => {
      // WHEN the main index module is imported
      require("./index");

      // THEN expect no errors or warning to have occurred
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();

      // AND expect the online provider to be in the DOM
      const isOnlineProviderElement = screen.getByTestId("isonline-provider-id");
      expect(isOnlineProviderElement).toBeInTheDocument();

      // AND expect the theme provider to be in the DOM
      const themeProviderElement = within(isOnlineProviderElement).getByTestId("theme-provider-id");
      expect(themeProviderElement).toBeInTheDocument();

      // AND expect the css baseline to be in the DOM
      const cssBaselineElement = screen.getByTestId("css-baseline-id");
      expect(cssBaselineElement).toBeInTheDocument();

      // AND expect the snackbar provider to be in the DOM and to be a child of the theme provider
      const snackbarProviderElement = within(themeProviderElement).getByTestId("snackbar-provider-id");
      expect(snackbarProviderElement).toBeInTheDocument();

      // AND expect the snackbar provider to be in the DOM and to be a child of the theme provider
      const authProviderElement = within(themeProviderElement).getByTestId("auth-provider-id");
      expect(authProviderElement).toBeInTheDocument();

      // AND expect the taxonomy app to be in the DOM and to be a child of the snackbar provider
      const taxonomyAppElement = within(snackbarProviderElement).getByTestId("tabiya-app-id");
      expect(taxonomyAppElement).toBeInTheDocument();
    });
  });
});
