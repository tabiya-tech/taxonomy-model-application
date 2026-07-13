// mute the console
import "src/_test_utilities/consoleMock";

import { render, screen } from "src/_test_utilities/test-utils";
import ApiDocsPage, { DATA_TEST_ID } from "./ApiDocsPage";

describe("Testing ApiDocsPage component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (console.error as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();
  });

  test("should render the API docs page successfully", () => {
    // WHEN the component is rendered
    render(<ApiDocsPage />);

    // THEN expect no errors or warnings to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND all the key sections of the page to be shown
    expect(screen.getByTestId(DATA_TEST_ID.API_DOCS_PAGE_ROOT)).toBeInTheDocument();
    expect(screen.getByTestId(DATA_TEST_ID.API_DOCS_PAGE_HEADING)).toBeInTheDocument();
    expect(screen.getByTestId(DATA_TEST_ID.API_DOCS_PAGE_INTRO)).toBeInTheDocument();
    expect(screen.getByTestId(DATA_TEST_ID.API_DOCS_PAGE_CREDENTIALS_SECTION)).toBeInTheDocument();
    expect(screen.getByTestId(DATA_TEST_ID.API_DOCS_PAGE_API_KEY_SECTION)).toBeInTheDocument();
    expect(screen.getByTestId(DATA_TEST_ID.API_DOCS_PAGE_API_KEY_CODE)).toBeInTheDocument();
    expect(screen.getByTestId(DATA_TEST_ID.API_DOCS_PAGE_OAUTH_CODE)).toBeInTheDocument();
    expect(screen.getByTestId(DATA_TEST_ID.API_DOCS_PAGE_REFERENCE_SECTION)).toBeInTheDocument();
    // AND the component should match the snapshot
    expect(screen.getByTestId(DATA_TEST_ID.API_DOCS_PAGE_ROOT)).toMatchSnapshot();
  });

  test("should render the heading and the curl examples", () => {
    // WHEN the component is rendered
    render(<ApiDocsPage />);

    // THEN expect the page heading to be shown
    expect(screen.getByTestId(DATA_TEST_ID.API_DOCS_PAGE_HEADING)).toHaveTextContent("Open Taxonomy Platform API");
    // AND the API key code block to contain the partner endpoint example
    const apiKeyCode = screen.getByTestId(DATA_TEST_ID.API_DOCS_PAGE_API_KEY_CODE);
    expect(apiKeyCode).toHaveTextContent("/api/partner/info");
    expect(apiKeyCode).toHaveTextContent("X-API-Key: YOUR_API_KEY");
    // AND the OAuth code block to contain the app endpoint example
    const oauthCode = screen.getByTestId(DATA_TEST_ID.API_DOCS_PAGE_OAUTH_CODE);
    expect(oauthCode).toHaveTextContent("/api/app/info");
    expect(oauthCode).toHaveTextContent("Authorization: Bearer YOUR_ACCESS_TOKEN");
  });

  test("should render every body link as an external link opening in a new tab", () => {
    // WHEN the component is rendered
    render(<ApiDocsPage />);

    // THEN expect all body links to point to an https URL and open safely in a new tab
    const linkTestIds = [
      DATA_TEST_ID.API_DOCS_PAGE_CREDENTIALS_LINK,
      DATA_TEST_ID.API_DOCS_PAGE_SWAGGER_LINK,
      DATA_TEST_ID.API_DOCS_PAGE_REDOC_LINK,
      DATA_TEST_ID.API_DOCS_PAGE_OPENAPI_LINK,
      DATA_TEST_ID.API_DOCS_PAGE_GUIDE_LINK,
    ];
    linkTestIds.forEach((testId) => {
      const link = screen.getByTestId(testId);
      expect(link).toHaveAttribute("href", expect.stringMatching(/^https:\/\//));
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
    });
  });
});
