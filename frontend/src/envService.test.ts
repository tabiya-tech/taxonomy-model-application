// silence chatty console
import "src/_test_utilities/consoleMock";
import {
  getEnv,
  getApiUrl,
  getLocalesUrl,
  getAuthUrl,
  getCognitoClientId,
  getCognitoClientSecretId,
  getLogoUrl,
  getNavbarLogos,
  getPartnerLogos,
  getThemeCssVariables,
  getBrowserTabTitle,
  getFaviconUrl,
  getAppIconUrl,
  getLandingPageCopy,
  getLandingPageStats,
  getApiDocsConfig,
} from "./envService";

// Some invalid values are caught JSON.parse errors (warn is called with the error as a 2nd arg) and some
// are valid JSON with the wrong shape (warn is called with just the message) - only check the message.
const expectWarnedWithMessage = (message: string) => {
  expect((console.warn as jest.Mock).mock.calls.some((call) => call[0] === message)).toBe(true);
};

test("getEnv should return the decoded environment variable value", () => {
  // GIVEN a key for an environment variable
  const key = "foo";
  // AND the environment variable is set to a base64 encoded string
  Object.defineProperty(window, "tabiyaConfig", {
    value: {
      foo: btoa("bar"),
    },
    writable: true,
  });
  // WHEN getEnv is called with the key
  const result = getEnv(key);
  // THEN expect the decoded URL to be returned
  expect(result).toBe("bar");
});

describe.each([
  ["BACKEND_URL", getApiUrl],
  ["LOCALES_URL", getLocalesUrl],
  ["AUTH_URL", getAuthUrl],
  ["COGNITO_CLIENT_ID", getCognitoClientId],
  ["COGNITO_CLIENT_SECRET", getCognitoClientSecretId],
  ["LOGO_URL", getLogoUrl],
  ["FRONTEND_BROWSER_TAB_TITLE", getBrowserTabTitle],
  ["FRONTEND_FAVICON_URL", getFaviconUrl],
  ["FRONTEND_APP_ICON_URL", getAppIconUrl],
])("Env Getters", (ENV_KEY, getterFn) => {
  describe(`${ENV_KEY} Getter (${getterFn.name}) tests`, () => {
    test(`getAPI should not fail if the ${ENV_KEY} is not set`, () => {
      // GIVEN the ENV_KEY environment variable is not set
      Object.defineProperty(window, "tabiyaConfig", {
        value: {},
        writable: true,
      });
      // WHEN getter Function is called
      const apiUrl = getterFn();
      // THEN expect it to return an empty string
      expect(apiUrl).toBe("");
    });

    test.each([
      ["undefined", undefined],
      ["null", null],
    ])("getEnv should handle a key with a %s value gracefully", (_description: string, value) => {
      // GIVEN a key for an environment variable
      const key = "foo";
      // AND the environment variable is set to an invalid base64 encoded string
      Object.defineProperty(window, "tabiyaConfig", {
        value: {
          foo: value,
        },
        writable: true,
      });
      // WHEN getEnv is called with the key
      const result = getEnv(key);
      // THEN expect an empty string to be returned
      expect(result).toBe("");
    });

    test(`${getterFn.name} should return the API base URL`, () => {
      // GIVEN the ENV_KEY environment variable is set to a base64 encoded string
      const givenUrl = "https://SomeUrl.com/api";
      Object.defineProperty(window, "tabiyaConfig", {
        value: {
          [ENV_KEY]: btoa(givenUrl),
        },
        writable: true,
      });
      // WHEN getter Function is called
      const expectedValue = getterFn();
      // THEN expect it to return the decoded ENV_KEY
      expect(expectedValue).toBe(givenUrl);
    });

    test("should handle base64 decoding errors gracefully", () => {
      // GIVEN the ENV KEY environment variable is set
      Object.defineProperty(window, "tabiyaConfig", {
        value: {
          [ENV_KEY]: "foo",
        },
        writable: true,
      });
      // AND the atob function will throw an error
      jest.spyOn(window, "atob").mockImplementationOnce(() => {
        throw new Error("atob error");
      });
      // WHEN getter Function is called
      const apiUrl = getterFn();
      // THEN expect it to return an empty string
      expect(apiUrl).toBe("");
      // AND expect an error to have been logged
      expect(console.error).toHaveBeenCalledWith("Error loading environment variable", expect.any(Error));
    });
  });
});

describe("getThemeCssVariables", () => {
  test("should return an empty object if FRONTEND_THEME_CSS_VARIABLES is not set", () => {
    // GIVEN the FRONTEND_THEME_CSS_VARIABLES environment variable is not set
    Object.defineProperty(window, "tabiyaConfig", {
      value: {},
      writable: true,
    });
    // WHEN getThemeCssVariables is called
    const result = getThemeCssVariables();
    // THEN expect it to return an empty object
    expect(result).toEqual({});
  });

  test("should return the parsed object when FRONTEND_THEME_CSS_VARIABLES is a valid JSON object of strings", () => {
    // GIVEN the FRONTEND_THEME_CSS_VARIABLES environment variable is set to a JSON object of strings
    const givenVariables = {
      "brand-primary": "0 33 71",
      "font-heading": '"IBM Plex Mono", monospace',
    };
    Object.defineProperty(window, "tabiyaConfig", {
      value: {
        FRONTEND_THEME_CSS_VARIABLES: btoa(JSON.stringify(givenVariables)),
      },
      writable: true,
    });
    // WHEN getThemeCssVariables is called
    const result = getThemeCssVariables();
    // THEN expect it to return the parsed object
    expect(result).toEqual(givenVariables);
  });

  test.each([
    ["not valid JSON", "not-json"],
    ["a JSON array rather than an object", JSON.stringify(["brand-primary"])],
    ["a JSON object containing a non-string value", JSON.stringify({ "brand-primary": 123 })],
  ])("should return an empty object and warn when FRONTEND_THEME_CSS_VARIABLES is %s", (_description, invalidValue) => {
    // GIVEN the FRONTEND_THEME_CSS_VARIABLES environment variable is set to an invalid value
    Object.defineProperty(window, "tabiyaConfig", {
      value: {
        FRONTEND_THEME_CSS_VARIABLES: btoa(invalidValue),
      },
      writable: true,
    });
    // WHEN getThemeCssVariables is called
    const result = getThemeCssVariables();
    // THEN expect it to return an empty object
    expect(result).toEqual({});
    // AND expect a warning to have been logged
    expectWarnedWithMessage(
      `Invalid FRONTEND_THEME_CSS_VARIABLES "${invalidValue}", expected a JSON object of string values. Falling back to default.`
    );
  });
});

describe("getNavbarLogos", () => {
  test("should return an empty array if NAVBAR_LOGOS is not set", () => {
    // GIVEN the NAVBAR_LOGOS environment variable is not set
    Object.defineProperty(window, "tabiyaConfig", {
      value: {},
      writable: true,
    });
    // WHEN getNavbarLogos is called
    const result = getNavbarLogos();
    // THEN expect it to return an empty array
    expect(result).toEqual([]);
  });

  test("should return the parsed array when NAVBAR_LOGOS is a valid JSON array of logo configs", () => {
    // GIVEN the NAVBAR_LOGOS environment variable is set to a JSON array of logo configs
    const givenLogos = [{ src: "/logo1.svg", alt: "My Org", height: 30, width: 100 }, { src: "/logo2.svg" }];
    Object.defineProperty(window, "tabiyaConfig", {
      value: {
        NAVBAR_LOGOS: btoa(JSON.stringify(givenLogos)),
      },
      writable: true,
    });
    // WHEN getNavbarLogos is called
    const result = getNavbarLogos();
    // THEN expect it to return the parsed array
    expect(result).toEqual(givenLogos);
  });

  test.each([
    ["not valid JSON", "not-json"],
    ["a JSON object rather than an array", JSON.stringify({ src: "/logo.svg" })],
    ["a JSON array containing non-object values", JSON.stringify(["/logo.svg"])],
    ["a JSON array with an entry missing src", JSON.stringify([{ alt: "My Org" }])],
    ["a JSON array with an entry with an empty src", JSON.stringify([{ src: "" }])],
    ["a JSON array with an entry with a non-string alt", JSON.stringify([{ src: "/logo.svg", alt: 123 }])],
    ["a JSON array with an entry with a non-numeric height", JSON.stringify([{ src: "/logo.svg", height: "30px" }])],
    ["a JSON array with an entry with a non-numeric width", JSON.stringify([{ src: "/logo.svg", width: "100px" }])],
  ])("should return an empty array and warn when NAVBAR_LOGOS is %s", (_description, invalidValue) => {
    // GIVEN the NAVBAR_LOGOS environment variable is set to an invalid value
    Object.defineProperty(window, "tabiyaConfig", {
      value: {
        NAVBAR_LOGOS: btoa(invalidValue),
      },
      writable: true,
    });
    // WHEN getNavbarLogos is called
    const result = getNavbarLogos();
    // THEN expect it to return an empty array
    expect(result).toEqual([]);
    // AND expect a warning to have been logged
    expectWarnedWithMessage(
      `Invalid NAVBAR_LOGOS "${invalidValue}", expected a JSON array of { src, alt?, height?, width? } objects. Falling back to default.`
    );
  });
});

describe("getPartnerLogos", () => {
  test("should return an empty array if PARTNER_LOGOS is not set", () => {
    // GIVEN the PARTNER_LOGOS environment variable is not set
    Object.defineProperty(window, "tabiyaConfig", {
      value: {},
      writable: true,
    });
    // WHEN getPartnerLogos is called
    const result = getPartnerLogos();
    // THEN expect it to return an empty array
    expect(result).toEqual([]);
  });

  test("should return the parsed array when PARTNER_LOGOS is a valid JSON array of logo configs", () => {
    // GIVEN the PARTNER_LOGOS environment variable is set to a JSON array of logo configs
    const givenLogos = [
      { src: "/world-bank-logo.svg", alt: "World Bank Group", height: 28 },
      { src: "/tabiya-logo.svg", alt: "Tabiya", height: 46 },
    ];
    Object.defineProperty(window, "tabiyaConfig", {
      value: {
        PARTNER_LOGOS: btoa(JSON.stringify(givenLogos)),
      },
      writable: true,
    });
    // WHEN getPartnerLogos is called
    const result = getPartnerLogos();
    // THEN expect it to return the parsed array
    expect(result).toEqual(givenLogos);
  });

  test("should return an empty array and warn when PARTNER_LOGOS is not a valid JSON array of logo configs", () => {
    // GIVEN the PARTNER_LOGOS environment variable is set to an invalid value
    Object.defineProperty(window, "tabiyaConfig", {
      value: {
        PARTNER_LOGOS: btoa("not-json"),
      },
      writable: true,
    });
    // WHEN getPartnerLogos is called
    const result = getPartnerLogos();
    // THEN expect it to return an empty array
    expect(result).toEqual([]);
    // AND expect a warning to have been logged
    expectWarnedWithMessage(
      `Invalid PARTNER_LOGOS "not-json", expected a JSON array of { src, alt?, height?, width? } objects. Falling back to default.`
    );
  });
});

describe("getLandingPageStats", () => {
  test("should return an empty array if FRONTEND_LANDING_STATS is not set", () => {
    // GIVEN the FRONTEND_LANDING_STATS environment variable is not set
    Object.defineProperty(window, "tabiyaConfig", {
      value: {},
      writable: true,
    });
    // WHEN getLandingPageStats is called
    const result = getLandingPageStats();
    // THEN expect it to return an empty array
    expect(result).toEqual([]);
  });

  test("should return the parsed array when FRONTEND_LANDING_STATS is a valid JSON array of stats", () => {
    // GIVEN the FRONTEND_LANDING_STATS environment variable is set to a JSON array of stats
    const givenStats = [
      { value: "131,000+", description: "raw eLMIS occupation records cleaned and standardized" },
      { value: "9,700", description: "reference occupations from the ILO" },
    ];
    Object.defineProperty(window, "tabiyaConfig", {
      value: {
        FRONTEND_LANDING_STATS: btoa(JSON.stringify(givenStats)),
      },
      writable: true,
    });
    // WHEN getLandingPageStats is called
    const result = getLandingPageStats();
    // THEN expect it to return the parsed array
    expect(result).toEqual(givenStats);
  });

  test.each([
    ["not valid JSON", "not-json"],
    ["a JSON object rather than an array", JSON.stringify({ value: "1", description: "foo" })],
    ["a JSON array containing non-object values", JSON.stringify(["foo"])],
    ["a JSON array with an entry missing value", JSON.stringify([{ description: "foo" }])],
    ["a JSON array with an entry with an empty value", JSON.stringify([{ value: "", description: "foo" }])],
    ["a JSON array with an entry missing description", JSON.stringify([{ value: "1" }])],
  ])("should return an empty array and warn when FRONTEND_LANDING_STATS is %s", (_description, invalidValue) => {
    // GIVEN the FRONTEND_LANDING_STATS environment variable is set to an invalid value
    Object.defineProperty(window, "tabiyaConfig", {
      value: {
        FRONTEND_LANDING_STATS: btoa(invalidValue),
      },
      writable: true,
    });
    // WHEN getLandingPageStats is called
    const result = getLandingPageStats();
    // THEN expect it to return an empty array
    expect(result).toEqual([]);
    // AND expect a warning to have been logged
    expectWarnedWithMessage(
      `Invalid FRONTEND_LANDING_STATS "${invalidValue}", expected a JSON array of { value, description } objects. Falling back to default.`
    );
  });
});

describe("getLandingPageCopy", () => {
  test("should return an empty object if FRONTEND_LANDING_COPY is not set", () => {
    // GIVEN the FRONTEND_LANDING_COPY environment variable is not set
    Object.defineProperty(window, "tabiyaConfig", {
      value: {},
      writable: true,
    });
    // WHEN getLandingPageCopy is called
    const result = getLandingPageCopy();
    // THEN expect it to return an empty object
    expect(result).toEqual({});
  });

  test("should return the parsed object when FRONTEND_LANDING_COPY is a valid JSON object", () => {
    // GIVEN the FRONTEND_LANDING_COPY environment variable is set to a valid JSON object
    const givenCopy = {
      eyebrow: { text: "foo eyebrow", color: "#123456" },
      heading: "foo heading",
      description: "foo description",
      ctaCaption: "foo cta caption",
      readMoreLink: { text: "foo link text", url: "https://example.com/foo" },
    };
    Object.defineProperty(window, "tabiyaConfig", {
      value: {
        FRONTEND_LANDING_COPY: btoa(JSON.stringify(givenCopy)),
      },
      writable: true,
    });
    // WHEN getLandingPageCopy is called
    const result = getLandingPageCopy();
    // THEN expect it to return the parsed object
    expect(result).toEqual(givenCopy);
  });

  test("should return the parsed object when the eyebrow color is omitted", () => {
    // GIVEN the FRONTEND_LANDING_COPY environment variable is set with an eyebrow that has no color
    const givenCopy = { eyebrow: { text: "foo eyebrow" } };
    Object.defineProperty(window, "tabiyaConfig", {
      value: {
        FRONTEND_LANDING_COPY: btoa(JSON.stringify(givenCopy)),
      },
      writable: true,
    });
    // WHEN getLandingPageCopy is called
    const result = getLandingPageCopy();
    // THEN expect it to return the parsed object
    expect(result).toEqual(givenCopy);
  });

  test.each([
    ["not valid JSON", "not-json"],
    ["a JSON array rather than an object", JSON.stringify([{ heading: "foo" }])],
    ["a JSON object with a non-string heading", JSON.stringify({ heading: 1 })],
    ["a JSON object with a non-string description", JSON.stringify({ description: 1 })],
    ["a JSON object with a non-string ctaCaption", JSON.stringify({ ctaCaption: 1 })],
    ["a JSON object with a non-object eyebrow", JSON.stringify({ eyebrow: "foo" })],
    ["a JSON object with an eyebrow missing text", JSON.stringify({ eyebrow: { color: "#123456" } })],
    ["a JSON object with an eyebrow with a non-string color", JSON.stringify({ eyebrow: { text: "foo", color: 1 } })],
    ["a JSON object with a non-object readMoreLink", JSON.stringify({ readMoreLink: "foo" })],
    ["a JSON object with a readMoreLink with a non-string text", JSON.stringify({ readMoreLink: { text: 1 } })],
    ["a JSON object with a readMoreLink with a non-string url", JSON.stringify({ readMoreLink: { url: 1 } })],
  ])("should return an empty object and warn when FRONTEND_LANDING_COPY is %s", (_description, invalidValue) => {
    // GIVEN the FRONTEND_LANDING_COPY environment variable is set to an invalid value
    Object.defineProperty(window, "tabiyaConfig", {
      value: {
        FRONTEND_LANDING_COPY: btoa(invalidValue),
      },
      writable: true,
    });
    // WHEN getLandingPageCopy is called
    const result = getLandingPageCopy();
    // THEN expect it to return an empty object
    expect(result).toEqual({});
    // AND expect a warning to have been logged
    expectWarnedWithMessage(`Invalid FRONTEND_LANDING_COPY "${invalidValue}". Falling back to default.`);
  });
});

describe("getApiDocsConfig", () => {
  test("should return an empty object if FRONTEND_API_DOCS is not set", () => {
    // GIVEN the FRONTEND_API_DOCS environment variable is not set
    Object.defineProperty(window, "tabiyaConfig", {
      value: {},
      writable: true,
    });
    // WHEN getApiDocsConfig is called
    const result = getApiDocsConfig();
    // THEN expect it to return an empty object
    expect(result).toEqual({});
  });

  test("should return the parsed object when FRONTEND_API_DOCS is a valid JSON object", () => {
    // GIVEN the FRONTEND_API_DOCS environment variable is set to a valid JSON object with every field
    const givenConfig = {
      apiBaseUrl: "https://foo.example.com",
      credentialsUrl: "https://bar.example.com/baz#credentials",
      exampleModel: { id: "mdl_foo_1234", label: "Foo, v1.0.0" },
      guide: { url: "https://bar.example.com/baz", label: "foo docs" },
    };
    Object.defineProperty(window, "tabiyaConfig", {
      value: {
        FRONTEND_API_DOCS: btoa(JSON.stringify(givenConfig)),
      },
      writable: true,
    });
    // WHEN getApiDocsConfig is called
    const result = getApiDocsConfig();
    // THEN expect it to return the parsed object
    expect(result).toEqual(givenConfig);
  });

  test("should return the parsed object when only some fields are set", () => {
    // GIVEN the FRONTEND_API_DOCS environment variable is set with only a subset of the fields
    const givenConfig = { apiBaseUrl: "https://foo.example.com" };
    Object.defineProperty(window, "tabiyaConfig", {
      value: {
        FRONTEND_API_DOCS: btoa(JSON.stringify(givenConfig)),
      },
      writable: true,
    });
    // WHEN getApiDocsConfig is called
    const result = getApiDocsConfig();
    // THEN expect it to return the parsed object
    expect(result).toEqual(givenConfig);
  });

  test.each([
    ["not valid JSON", "not-json"],
    ["a JSON array rather than an object", JSON.stringify([{ apiBaseUrl: "https://foo.example.com" }])],
    ["a JSON object with a non-string apiBaseUrl", JSON.stringify({ apiBaseUrl: 1 })],
    ["a JSON object with a non-string credentialsUrl", JSON.stringify({ credentialsUrl: 1 })],
    ["a JSON object with a non-object exampleModel", JSON.stringify({ exampleModel: "foo" })],
    ["a JSON object with an exampleModel with a non-string id", JSON.stringify({ exampleModel: { id: 1 } })],
    ["a JSON object with an exampleModel with a non-string label", JSON.stringify({ exampleModel: { label: 1 } })],
    ["a JSON object with a non-object guide", JSON.stringify({ guide: "foo" })],
    ["a JSON object with a guide with a non-string url", JSON.stringify({ guide: { url: 1 } })],
    ["a JSON object with a guide with a non-string label", JSON.stringify({ guide: { label: 1 } })],
  ])("should return an empty object and warn when FRONTEND_API_DOCS is %s", (_description, invalidValue) => {
    // GIVEN the FRONTEND_API_DOCS environment variable is set to an invalid value
    Object.defineProperty(window, "tabiyaConfig", {
      value: {
        FRONTEND_API_DOCS: btoa(invalidValue),
      },
      writable: true,
    });
    // WHEN getApiDocsConfig is called
    const result = getApiDocsConfig();
    // THEN expect it to return an empty object
    expect(result).toEqual({});
    // AND expect a warning to have been logged
    expectWarnedWithMessage(
      `Invalid FRONTEND_API_DOCS "${invalidValue}", expected a JSON object of string values. Falling back to default.`
    );
  });
});
