// mute the console
import "src/_test_utilities/consoleMock";

import { render, screen } from "src/_test_utilities/test-utils";
import ApiDocsPage, { DATA_TEST_ID } from "./ApiDocsPage";

describe("Testing ApiDocsPage component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (console.error as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();
    // reset the customization env var so each test starts from the defaults
    Object.defineProperty(window, "tabiyaConfig", { value: {}, writable: true });
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

  test("should fall back to the default values when FRONTEND_API_DOCS is not set", () => {
    // GIVEN the FRONTEND_API_DOCS environment variable is not set (see beforeEach)
    // WHEN the component is rendered
    render(<ApiDocsPage />);

    // THEN expect the intro to name a default model id, followed by its label in brackets
    // (the exact default copy is covered by the snapshot)
    expect(screen.getByTestId(DATA_TEST_ID.API_DOCS_PAGE_INTRO)).toHaveTextContent(/mdl_\w+ \(.+\)\.$/);
    // AND the curl examples and reference links to be built from the default host
    expect(screen.getByTestId(DATA_TEST_ID.API_DOCS_PAGE_API_KEY_CODE)).toHaveTextContent(
      /https:\/\/\S+\/api\/partner\/info/
    );
    expect(screen.getByTestId(DATA_TEST_ID.API_DOCS_PAGE_SWAGGER_LINK)).toHaveAttribute(
      "href",
      expect.stringMatching(/^https:\/\/.+\/api-doc\/swagger\/$/)
    );
    expect(screen.getByTestId(DATA_TEST_ID.API_DOCS_PAGE_REDOC_LINK)).toHaveAttribute(
      "href",
      expect.stringMatching(/^https:\/\/.+\/api-doc\/redoc\/$/)
    );
    // AND the guide link to be labelled with the default guide host
    expect(screen.getByTestId(DATA_TEST_ID.API_DOCS_PAGE_GUIDE_LINK)).toHaveTextContent(/^[a-z0-9.-]+\.[a-z]+$/);
    // AND no warning to have been logged
    expect(console.warn).not.toHaveBeenCalled();
  });

  test("should show the configured model, host and links when FRONTEND_API_DOCS is set, instead of the defaults", () => {
    // GIVEN every FRONTEND_API_DOCS field is set to an arbitrary value
    const givenConfig = {
      apiBaseUrl: "https://foo.example.com",
      credentialsUrl: "https://bar.example.com/baz#credentials",
      exampleModel: { id: "mdl_foo_1234", label: "Foo, v3.2.1" },
      guide: { url: "https://bar.example.com/baz", label: "foo docs" },
    };
    Object.defineProperty(window, "tabiyaConfig", {
      value: { FRONTEND_API_DOCS: btoa(JSON.stringify(givenConfig)) },
      writable: true,
    });

    // WHEN the component is rendered
    render(<ApiDocsPage />);

    // THEN expect the configured model to be shown in the intro
    expect(screen.getByTestId(DATA_TEST_ID.API_DOCS_PAGE_INTRO)).toHaveTextContent(
      `${givenConfig.exampleModel.id} (${givenConfig.exampleModel.label})`
    );
    // AND the configured host to be used in both curl examples
    expect(screen.getByTestId(DATA_TEST_ID.API_DOCS_PAGE_API_KEY_CODE)).toHaveTextContent(
      `${givenConfig.apiBaseUrl}/api/partner/info`
    );
    expect(screen.getByTestId(DATA_TEST_ID.API_DOCS_PAGE_OAUTH_CODE)).toHaveTextContent(
      `${givenConfig.apiBaseUrl}/api/app/info`
    );
    // AND the credentials and guide links to be the configured ones
    expect(screen.getByTestId(DATA_TEST_ID.API_DOCS_PAGE_CREDENTIALS_LINK)).toHaveAttribute(
      "href",
      givenConfig.credentialsUrl
    );
    const guideLink = screen.getByTestId(DATA_TEST_ID.API_DOCS_PAGE_GUIDE_LINK);
    expect(guideLink).toHaveAttribute("href", givenConfig.guide.url);
    expect(guideLink).toHaveTextContent(givenConfig.guide.label);
  });

  test("should build the reference links from apiBaseUrl and derive the guide label from guide.url", () => {
    // GIVEN only the API base URL and the guide URL are configured, with a trailing slash on the base URL
    Object.defineProperty(window, "tabiyaConfig", {
      value: {
        FRONTEND_API_DOCS: btoa(
          JSON.stringify({
            apiBaseUrl: "https://foo.example.com/",
            guide: { url: "https://bar.example.com/baz" },
          })
        ),
      },
      writable: true,
    });

    // WHEN the component is rendered
    render(<ApiDocsPage />);

    // THEN expect the trailing slash to be trimmed rather than doubled up in the curl example
    expect(screen.getByTestId(DATA_TEST_ID.API_DOCS_PAGE_API_KEY_CODE)).toHaveTextContent(
      "https://foo.example.com/api/partner/info"
    );
    // AND the reference links to be built from the configured base URL
    expect(screen.getByTestId(DATA_TEST_ID.API_DOCS_PAGE_SWAGGER_LINK)).toHaveAttribute(
      "href",
      "https://foo.example.com/api-doc/swagger/"
    );
    expect(screen.getByTestId(DATA_TEST_ID.API_DOCS_PAGE_REDOC_LINK)).toHaveAttribute(
      "href",
      "https://foo.example.com/api-doc/redoc/"
    );
    expect(screen.getByTestId(DATA_TEST_ID.API_DOCS_PAGE_OPENAPI_LINK)).toHaveAttribute(
      "href",
      "https://foo.example.com/api-doc/swagger/tabiya-api.json"
    );
    // AND the guide label to be derived from the guide URL host
    expect(screen.getByTestId(DATA_TEST_ID.API_DOCS_PAGE_GUIDE_LINK)).toHaveTextContent("bar.example.com");
  });
});
