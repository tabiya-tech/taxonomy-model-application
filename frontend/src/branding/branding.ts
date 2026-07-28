import { getAppIconUrl, getBrowserTabTitle, getFaviconUrl, getThemeCssVariables } from "src/envService";

const setCssVar = (name: string, value: string) => {
  document.documentElement.style.setProperty(name, value);
};

const upsertLinkHref = (rel: string, href: string) => {
  if (!href) return;

  const existing = document.querySelector(`link[rel='${rel}']`);
  if (existing instanceof HTMLLinkElement) {
    existing.href = href;
    return;
  }

  const link = document.createElement("link");
  link.rel = rel;
  link.href = href;
  document.head.appendChild(link);
};

/**
 * Apply branding overrides from environment variables.
 * This includes theme CSS variables, browser tab title, and favicon/app icon.
 * Only the variables that are provided in the environment are applied.
 */
export const applyBrandingFromEnv = (): void => {
  // Theme variables (colors/fonts). We only set variables that are provided.
  const themeCssVariables = getThemeCssVariables();
  Object.entries(themeCssVariables).forEach(([key, value]) => {
    if (value) {
      setCssVar(`--${key}`, value);
    }
  });

  // Browser tab title
  const browserTabTitle = getBrowserTabTitle();
  if (browserTabTitle) {
    document.title = browserTabTitle;
  }

  // Icons
  const faviconUrl = getFaviconUrl();
  if (faviconUrl) {
    upsertLinkHref("icon", faviconUrl);
  }

  const appIconUrl = getAppIconUrl();
  if (appIconUrl) {
    upsertLinkHref("apple-touch-icon", appIconUrl);
  }
};
