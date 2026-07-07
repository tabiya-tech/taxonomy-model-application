// mute the console
import "src/_test_utilities/consoleMock";

import { render, screen } from "src/_test_utilities/test-utils";
import userEvent from "@testing-library/user-event";
import LandingPage, { DATA_TEST_ID } from "./LandingPage";
import { routerPaths } from "src/app/routerPaths";

// mock useNavigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// mock AppHeader since it is tested separately
jest.mock("src/app/components/AppHeader", () => {
  return {
    __esModule: true,
    default: () => <div data-testid="mock-app-header" />,
  };
});

describe("Testing LandingPage component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (console.error as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();
  });

  test("should render the landing page successfully", () => {
    // WHEN the component is rendered
    render(<LandingPage />);

    // THEN expect no errors or warnings to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND all the key sections of the landing page to be shown
    expect(screen.getByTestId(DATA_TEST_ID.LANDING_PAGE_ROOT)).toBeInTheDocument();
    expect(screen.getByTestId(DATA_TEST_ID.LANDING_PAGE_HERO_HEADER)).toBeInTheDocument();
    expect(screen.getByTestId(DATA_TEST_ID.LANDING_PAGE_HEADING)).toBeInTheDocument();
    expect(screen.getByTestId(DATA_TEST_ID.LANDING_PAGE_DESCRIPTION)).toBeInTheDocument();
    expect(screen.getByTestId(DATA_TEST_ID.LANDING_PAGE_START_EXPLORING_BUTTON)).toBeInTheDocument();
    expect(screen.getByTestId(DATA_TEST_ID.LANDING_PAGE_BROWSE_TAXONOMIES_BUTTON)).toBeInTheDocument();
    expect(screen.getByTestId(DATA_TEST_ID.LANDING_PAGE_STATS_SECTION)).toBeInTheDocument();
    expect(screen.getByTestId(DATA_TEST_ID.LANDING_PAGE_API_BANNER)).toBeInTheDocument();
    // AND the AppHeader to be rendered
    expect(screen.getByTestId(DATA_TEST_ID.LANDING_PAGE_NAV)).toBeInTheDocument();
    // AND the component should match the snapshot
    expect(screen.getByTestId(DATA_TEST_ID.LANDING_PAGE_ROOT)).toMatchSnapshot();
  });

  test("should navigate to the explorer when 'Start exploring' is clicked", async () => {
    // GIVEN the landing page is rendered
    render(<LandingPage />);

    // WHEN the user clicks on the "Start exploring" button
    await userEvent.click(screen.getByTestId(DATA_TEST_ID.LANDING_PAGE_START_EXPLORING_BUTTON));

    // THEN expect the user to be navigated to the explorer
    expect(mockNavigate).toHaveBeenCalledWith(routerPaths.EXPLORER);
  });

  test("should navigate to the model directory when 'Browse all taxonomies' is clicked", async () => {
    // GIVEN the landing page is rendered
    render(<LandingPage />);

    // WHEN the user clicks on the "Browse all taxonomies" button
    await userEvent.click(screen.getByTestId(DATA_TEST_ID.LANDING_PAGE_BROWSE_TAXONOMIES_BUTTON));

    // THEN expect the user to be navigated to the model directory
    expect(mockNavigate).toHaveBeenCalledWith(routerPaths.MODEL_DIRECTORY);
  });
});
