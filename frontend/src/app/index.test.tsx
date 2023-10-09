// mute the console
import "src/_test_utilities/consoleMock";

import { render, screen } from "src/_test_utilities/test-utils";
import TaxonomyModelApp from "./index";
import { Route } from "react-router-dom";
import routerConfig from "./routerConfig";

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
});
