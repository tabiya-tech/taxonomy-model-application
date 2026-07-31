// mute the console
import "src/_test_utilities/consoleMock";

import { act, render, screen, waitFor } from "src/_test_utilities/test-utils";
import userEvent from "@testing-library/user-event";
import LandingPage, { DATA_TEST_ID } from "./LandingPage";
import { routerPaths } from "src/app/routerPaths";
import { DATA_TEST_ID as FOOTER_DATA_TEST_ID } from "src/Footer/Footer";
import ModelInfoService from "src/modelInfo/modelInfo.service";
import { getOneDeterministicFakeModel } from "src/modeldirectory/_test_utilities/mockModelData";

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
  let getAllModelsSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    (console.error as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();
    Object.defineProperty(window, "tabiyaConfig", {
      value: {},
      writable: true,
    });
    // the page counts the available taxonomies to label the "Browse..." button
    getAllModelsSpy = jest.spyOn(ModelInfoService.prototype, "getAllModels").mockResolvedValue([]);
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

  test("should navigate to the model directory when the browse taxonomies button is clicked", async () => {
    // GIVEN the landing page is rendered
    render(<LandingPage />);

    // WHEN the user clicks on the browse taxonomies button
    await userEvent.click(screen.getByTestId(DATA_TEST_ID.LANDING_PAGE_BROWSE_TAXONOMIES_BUTTON));

    // THEN expect the user to be navigated to the model directory
    expect(mockNavigate).toHaveBeenCalledWith(routerPaths.MODEL_DIRECTORY);
  });

  test("should say 'Browse all taxonomies' when there is more than one taxonomy", async () => {
    // GIVEN two released and exported taxonomies
    getAllModelsSpy.mockResolvedValueOnce([getOneDeterministicFakeModel(1), getOneDeterministicFakeModel(2)]);

    // WHEN the landing page is rendered
    render(<LandingPage />);

    // THEN expect the button to offer all of them
    await waitFor(() => {
      expect(screen.getByTestId(DATA_TEST_ID.LANDING_PAGE_BROWSE_TAXONOMIES_BUTTON)).toHaveTextContent(
        "Browse all taxonomies"
      );
    });
  });

  test("should say 'Browse taxonomies' when there is a single taxonomy", async () => {
    // GIVEN a single taxonomy
    getAllModelsSpy.mockResolvedValueOnce([getOneDeterministicFakeModel(1)]);

    // WHEN the landing page is rendered
    render(<LandingPage />);

    // THEN expect the button not to promise more than the one taxonomy
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByTestId(DATA_TEST_ID.LANDING_PAGE_BROWSE_TAXONOMIES_BUTTON)).toHaveTextContent(
      "Browse taxonomies"
    );
  });

  test("should navigate to the API docs when 'Read the API docs' is clicked", async () => {
    // GIVEN the landing page is rendered
    render(<LandingPage />);

    // WHEN the user clicks on the "Read the API docs" banner link
    await userEvent.click(screen.getByTestId(DATA_TEST_ID.LANDING_PAGE_API_BANNER_LINK));

    // THEN expect the user to be navigated to the API docs
    expect(mockNavigate).toHaveBeenCalledWith(routerPaths.API_DOCS);
  });

  test("should not show the footer when no partner logos are configured", () => {
    // GIVEN the PARTNER_LOGOS environment variable is not set (default from beforeEach)

    // WHEN the landing page is rendered
    render(<LandingPage />);

    // THEN expect the footer not to be shown
    expect(screen.queryByTestId(FOOTER_DATA_TEST_ID.FOOTER)).not.toBeInTheDocument();
  });

  test("should show the footer with the partner logos when configured", () => {
    // GIVEN the PARTNER_LOGOS environment variable is set to a JSON array of logo configs
    Object.defineProperty(window, "tabiyaConfig", {
      value: {
        PARTNER_LOGOS: btoa(JSON.stringify([{ src: "/world-bank-logo.svg", alt: "World Bank Group" }])),
      },
      writable: true,
    });

    // WHEN the landing page is rendered
    render(<LandingPage />);

    // THEN expect the footer and its logo to be shown
    expect(screen.getByTestId(FOOTER_DATA_TEST_ID.FOOTER)).toBeInTheDocument();
    expect(screen.getByTestId(FOOTER_DATA_TEST_ID.FOOTER_LOGO)).toHaveAttribute("src", "/world-bank-logo.svg");
  });

  test("should show the description, CTA caption and stats when none are configured", () => {
    // GIVEN none of the landing page copy env vars are set (default from beforeEach)

    // WHEN the landing page is rendered
    render(<LandingPage />);

    // THEN expect the description, CTA caption and stats section to be shown
    expect(screen.getByTestId(DATA_TEST_ID.LANDING_PAGE_DESCRIPTION)).toBeInTheDocument();
    expect(screen.getByTestId(DATA_TEST_ID.LANDING_PAGE_CTA_CAPTION)).toBeInTheDocument();
    expect(screen.getByTestId(DATA_TEST_ID.LANDING_PAGE_STATS_SECTION)).toBeInTheDocument();
  });

  test("should show the configured eyebrow, heading, description, CTA caption and stats when set, instead of the defaults", () => {
    // GIVEN the landing page copy env vars are set to arbitrary values
    const givenEyebrowText = "foo eyebrow";
    const givenEyebrowColor = "#123456";
    const givenHeading = "foo heading bar";
    const givenDescription = "foo bar baz";
    const givenCtaCaption = "lorem ipsum dolor sit amet";
    const givenReadMoreLinkText = "foo link text";
    const givenReadMoreLinkUrl = "https://example.com/foo";
    const givenStats = [
      { value: "foo", description: "bar baz" },
      { value: "qux", description: "quux corge" },
    ];
    Object.defineProperty(window, "tabiyaConfig", {
      value: {
        FRONTEND_LANDING_COPY: btoa(
          JSON.stringify({
            eyebrow: { text: givenEyebrowText, color: givenEyebrowColor },
            heading: givenHeading,
            description: givenDescription,
            ctaCaption: givenCtaCaption,
            readMoreLink: { text: givenReadMoreLinkText, url: givenReadMoreLinkUrl },
          })
        ),
        FRONTEND_LANDING_STATS: btoa(JSON.stringify(givenStats)),
      },
      writable: true,
    });

    // WHEN the landing page is rendered
    render(<LandingPage />);

    // THEN expect the configured eyebrow, heading, description, CTA caption and stats to be shown instead of the defaults
    expect(screen.getByTestId(DATA_TEST_ID.LANDING_PAGE_EYEBROW)).toHaveTextContent(givenEyebrowText);
    expect(screen.getByTestId(DATA_TEST_ID.LANDING_PAGE_EYEBROW)).toHaveStyle({ color: givenEyebrowColor });
    expect(screen.getByTestId(DATA_TEST_ID.LANDING_PAGE_HEADING)).toHaveTextContent(givenHeading);
    expect(screen.getByTestId(DATA_TEST_ID.LANDING_PAGE_DESCRIPTION)).toHaveTextContent(givenDescription);
    expect(screen.getByTestId(DATA_TEST_ID.LANDING_PAGE_CTA_CAPTION)).toHaveTextContent(givenCtaCaption);
    expect(screen.getByTestId(DATA_TEST_ID.LANDING_PAGE_READ_MORE_LINK)).toHaveTextContent(givenReadMoreLinkText);
    expect(screen.getByTestId(DATA_TEST_ID.LANDING_PAGE_READ_MORE_LINK)).toHaveAttribute("href", givenReadMoreLinkUrl);
    expect(screen.getByTestId(DATA_TEST_ID.LANDING_PAGE_STATS_SECTION)).toHaveTextContent(
      `${givenStats[0].value}${givenStats[0].description}`
    );
    expect(screen.getByTestId(DATA_TEST_ID.LANDING_PAGE_STATS_SECTION)).toHaveTextContent(
      `${givenStats[1].value}${givenStats[1].description}`
    );
  });
});
