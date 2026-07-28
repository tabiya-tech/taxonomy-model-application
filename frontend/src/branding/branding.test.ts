// silence chatty console
import "src/_test_utilities/consoleMock";
import { applyBrandingFromEnv } from "./branding";

const DEFAULT_TITLE = "Taxonomy Model App";
const DEFAULT_FAVICON = "/favicon.ico";
const DEFAULT_APP_ICON = "/Logo.svg";

const setUpDom = () => {
  document.head.innerHTML = `
    <title>${DEFAULT_TITLE}</title>
    <link rel="icon" href="${DEFAULT_FAVICON}" />
    <link rel="apple-touch-icon" href="${DEFAULT_APP_ICON}" />
  `;
  document.documentElement.removeAttribute("style");
};

describe("applyBrandingFromEnv", () => {
  beforeEach(() => {
    setUpDom();
    Object.defineProperty(window, "tabiyaConfig", {
      value: {},
      writable: true,
    });
  });

  test("should not change the title, favicon or app icon when no branding env vars are set", () => {
    // GIVEN no branding env vars are set (default from beforeEach)

    // WHEN applyBrandingFromEnv is called
    applyBrandingFromEnv();

    // THEN expect the title, favicon and app icon to be unchanged
    expect(document.title).toBe(DEFAULT_TITLE);
    expect(document.querySelector('link[rel="icon"]')?.getAttribute("href")).toBe(DEFAULT_FAVICON);
    expect(document.querySelector('link[rel="apple-touch-icon"]')?.getAttribute("href")).toBe(DEFAULT_APP_ICON);
    // AND no CSS custom properties to have been set
    expect(document.documentElement.style.length).toBe(0);
  });

  test("should apply the title, favicon, app icon and theme CSS variables when set", () => {
    // GIVEN all branding env vars are set
    const givenTitle = "My Taxonomy";
    const givenFavicon = "/my-favicon.ico";
    const givenAppIcon = "/my-app-icon.svg";
    const givenThemeVariables = {
      "brand-primary": "44 113 184",
      "font-heading": '"Bricolage Grotesque", sans-serif',
    };
    Object.defineProperty(window, "tabiyaConfig", {
      value: {
        FRONTEND_BROWSER_TAB_TITLE: btoa(givenTitle),
        FRONTEND_FAVICON_URL: btoa(givenFavicon),
        FRONTEND_APP_ICON_URL: btoa(givenAppIcon),
        FRONTEND_THEME_CSS_VARIABLES: btoa(JSON.stringify(givenThemeVariables)),
      },
      writable: true,
    });

    // WHEN applyBrandingFromEnv is called
    applyBrandingFromEnv();

    // THEN expect the title, favicon and app icon to be updated
    expect(document.title).toBe(givenTitle);
    expect(document.querySelector('link[rel="icon"]')?.getAttribute("href")).toBe(givenFavicon);
    expect(document.querySelector('link[rel="apple-touch-icon"]')?.getAttribute("href")).toBe(givenAppIcon);
    // AND expect the theme CSS variables to have been set on the root element
    expect(document.documentElement.style.getPropertyValue("--brand-primary")).toBe(
      givenThemeVariables["brand-primary"]
    );
    expect(document.documentElement.style.getPropertyValue("--font-heading")).toBe(givenThemeVariables["font-heading"]);
  });

  test("should create the favicon/app-icon link tags when they don't already exist in the document", () => {
    // GIVEN a document without existing favicon/apple-touch-icon link tags
    document.head.innerHTML = `<title>${DEFAULT_TITLE}</title>`;
    const givenFavicon = "/my-favicon.ico";
    const givenAppIcon = "/my-app-icon.svg";
    Object.defineProperty(window, "tabiyaConfig", {
      value: {
        FRONTEND_FAVICON_URL: btoa(givenFavicon),
        FRONTEND_APP_ICON_URL: btoa(givenAppIcon),
      },
      writable: true,
    });

    // WHEN applyBrandingFromEnv is called
    applyBrandingFromEnv();

    // THEN expect the favicon and app icon link tags to have been created
    expect(document.querySelector('link[rel="icon"]')?.getAttribute("href")).toBe(givenFavicon);
    expect(document.querySelector('link[rel="apple-touch-icon"]')?.getAttribute("href")).toBe(givenAppIcon);
  });
});
