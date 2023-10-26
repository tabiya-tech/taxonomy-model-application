// mute the console
import "src/_test_utilities/consoleMock";

import { render, screen } from "src/_test_utilities/test-utils";
import TaxonomyModelApp, { SNACKBAR_AUTO_HIDE_DURATION, SNACKBAR_KEYS } from "./index";
import { Route } from "react-router-dom";
import routerConfig from "./routerConfig";
import { useSnackbar } from "src/theme/SnackbarProvider/SnackbarProvider";
import { unmockBrowserIsOnLine, mockBrowserIsOnLine } from "src/_test_utilities/mockBrowserIsOnline";

// mock the snackbar
jest.mock("src/theme/SnackbarProvider/SnackbarProvider", () => {
  const actual = jest.requireActual("src/theme/SnackbarProvider/SnackbarProvider");
  return {
    ...actual,
    __esModule: true,
    useSnackbar: jest.fn().mockReturnValue({
      enqueueSnackbar: jest.fn(),
      closeSnackbar: jest.fn(),
    }),
  };
});
jest.mock("src/app/components/AppLayout.tsx", () => {
  const mAppLayout = jest.fn().mockImplementation(({ children }) => <div data-testid="app-layout-id">{children}</div>);
  return {
    __esModule: true,
    AppLayout: mAppLayout,
    default: mAppLayout,
  };
});

jest.mock("react-router-dom", () => {
  return {
    __esModule: true,
    HashRouter: jest.fn().mockImplementation(({ children }) => <div data-testid="hash-router-id">{children}</div>),
    Route: jest.fn().mockImplementation(({ children }) => <div data-testid="route-id">{children}</div>),
    Routes: jest.fn().mockImplementation(({ children }) => <div data-testid="routes-id">{children}</div>),
  };
});

describe("main taxonomy app test", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    unmockBrowserIsOnLine();
  });

  it("should render TaxonomyModelApp app", () => {
    // WHEN the app is rendered
    render(<TaxonomyModelApp />);

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND the HASH ROUTER to be in the document and the
    const router = screen.getByTestId("hash-router-id");
    expect(router).toBeInTheDocument();

    // AND expect the AppLayout to be in the document
    const app = screen.getByTestId("app-layout-id");
    expect(app).toBeInTheDocument();

    // AND for each path to have a route configured
    const allRoutes = screen.queryAllByTestId("route-id");
    expect(allRoutes.length).toBe(routerConfig.length);

    // AND The routes to be configured with the router config
    routerConfig.forEach((cfg) => {
      expect(Route).toHaveBeenCalledWith(cfg, {});
    });
  });

  describe("when the app is offline/online", () => {
    const expectedOfflineSnackBar = {
      variant: "warning",
      key: SNACKBAR_KEYS.OFFLINE_ERROR,
      preventDuplicate: true,
      persist: true,
      action: [],
    };
    const expectedOnlineSnackBar = {
      variant: "success",
      key: SNACKBAR_KEYS.ONLINE_SUCCESS,
      preventDuplicate: true,
      autoHideDuration: SNACKBAR_AUTO_HIDE_DURATION,
    };
    const expectedMessageOffline = `You are offline`;
    const expectedMessageOnline = `You are back online`;

    it("should show the online then offline notification when the browser switches from offline->online->offline", async () => {
      // GIVEN that the app is initially rendered while the browser is offline
      mockBrowserIsOnLine(false);
      render(<TaxonomyModelApp />);

      // THEN expect the offline notification to be shown
      expect(useSnackbar().enqueueSnackbar).toHaveBeenCalledWith(expectedMessageOffline, expectedOfflineSnackBar);

      // AND WHEN the browser goes online
      mockBrowserIsOnLine(true);

      // THEN expect the offline notification to disappear
      expect(useSnackbar().closeSnackbar).toHaveBeenCalledWith(SNACKBAR_KEYS.OFFLINE_ERROR);
      // AND the online notification to be shown
      expect(useSnackbar().enqueueSnackbar).toHaveBeenCalledWith(expectedMessageOnline, expectedOnlineSnackBar);

      // AND WHEN the browser goes offline again
      mockBrowserIsOnLine(false);
      // THEN  the online notification to be shown
      expect(useSnackbar().closeSnackbar).toHaveBeenCalledWith(SNACKBAR_KEYS.ONLINE_SUCCESS);
      // AND the online notification to be shown
      expect(useSnackbar().enqueueSnackbar).toHaveBeenCalledWith(expectedMessageOffline, expectedOfflineSnackBar);
    });

    it("should show the offline notification when the app renders for the first time and the browser is offline", async () => {
      // GIVEN the browser is offline
      mockBrowserIsOnLine(false);

      // WHEN the app is rendered
      render(<TaxonomyModelApp />);

      // THEN the offline warning should be shown
      expect(useSnackbar().enqueueSnackbar).toHaveBeenCalledWith(expectedMessageOffline, expectedOfflineSnackBar);
    });

    it("should not show the online notification when the app renders for the first time and the browser is online", async () => {
      // GIVEN that the browser is online
      mockBrowserIsOnLine(true);

      // WHEN the app is rendered
      render(<TaxonomyModelApp />);

      // THEN expect the offline and online notification to not be shown
      expect(useSnackbar().enqueueSnackbar).not.toHaveBeenCalled();
    });
  });
});
