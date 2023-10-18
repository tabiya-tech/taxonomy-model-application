// mute the console
import "src/_test_utilities/consoleMock";

import { render, screen, waitFor, fireEvent, createEvent } from "src/_test_utilities/test-utils";
import TaxonomyModelApp, { SNACKBAR_KEYS } from "./index";
import { Route } from "react-router-dom";
import routerConfig from "./routerConfig";
import { useSnackbar } from "src/theme/SnackbarProvider/SnackbarProvider";

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
    (console.error as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();
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

  it("should listen and handle the online event", async () => {
    // GIVEN the offline and online event are registered
    const addEventListenerSpy = jest.spyOn(window, "addEventListener");
    const removeEventListenerSpy = jest.spyOn(window, "removeEventListener");
    // WHEN the app is rendered
    const { unmount } = render(<TaxonomyModelApp />);
    // THEN online and offline events should be registered with a handler
    expect(addEventListenerSpy).toHaveBeenCalledWith("online", expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith("offline", expect.any(Function));

    // WHEN browser is offline
    const offlineEvent = createEvent.offline(window);
    fireEvent(window, offlineEvent);
    // THEN offline warning should be shown
    expect(useSnackbar().enqueueSnackbar).toHaveBeenCalledWith(`You are offline`, {
      variant: "warning",
      key: SNACKBAR_KEYS.OFFLINE_ERROR,
      preventDuplicate: true,
      persist: true,
    });

    // WHEN the browser is back online
    const onlineEvent = createEvent.online(window);
    fireEvent(window, onlineEvent);
    // THEN the snackbar should be closed
    expect(useSnackbar().closeSnackbar).toHaveBeenCalledWith(SNACKBAR_KEYS.OFFLINE_ERROR);

    // WHEN the ModelDirectory is unmounted
    await waitFor(() => {
      unmount();
    });
    // THEN the event listeners should be removed
    expect(removeEventListenerSpy).toHaveBeenCalledWith("online", expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith("offline", expect.any(Function));
  });
});
