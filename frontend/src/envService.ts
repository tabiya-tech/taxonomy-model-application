export const getEnv = (key: string) => {
  // This is a global variable that is set by the env.js module loaded in the index.html
  // This method can be used synchronously to get the value of an environment variable anywhere in the frontend code
  try {
    // @ts-ignore
    const env = window.tabiyaConfig;
    if (!env?.[key]) {
      return "";
    }
    return window.atob(env[key]);
  } catch (e) {
    console.error("Error loading environment variable", e);
    return "";
  }
};

export const getApiUrl = () => {
  return getEnv("BACKEND_URL");
};

export const getLocalesUrl = () => {
  return getEnv("LOCALES_URL");
};

export const getAuthUrl = () => {
  return getEnv("AUTH_URL");
};

export const getCognitoClientId = () => {
  return getEnv("COGNITO_CLIENT_ID");
};

export const getCognitoClientSecretId = () => {
  return getEnv("COGNITO_CLIENT_SECRET");
};

export const getLogoUrl = () => {
  return getEnv("LOGO_URL");
};

export interface LogoConfig {
  src: string;
  alt?: string;
  height?: number;
  width?: number;
}

const isValidLogoConfig = (value: unknown): value is LogoConfig => {
  if (typeof value !== "object" || value === null) return false;
  const logo = value as Record<string, unknown>;
  return (
    typeof logo.src === "string" &&
    logo.src.length > 0 &&
    (logo.alt === undefined || typeof logo.alt === "string") &&
    (logo.height === undefined || typeof logo.height === "number") &&
    (logo.width === undefined || typeof logo.width === "number")
  );
};

const getLogoConfigs = (envKey: string): LogoConfig[] => {
  const raw = getEnv(envKey);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every(isValidLogoConfig)) {
      return parsed;
    }
    console.warn(
      `Invalid ${envKey} "${raw}", expected a JSON array of { src, alt?, height?, width? } objects. Falling back to default.`
    );
    return [];
  } catch (e) {
    console.warn(
      `Invalid ${envKey} "${raw}", expected a JSON array of { src, alt?, height?, width? } objects. Falling back to default.`,
      e
    );
    return [];
  }
};

export const getNavbarLogos = (): LogoConfig[] => {
  return getLogoConfigs("NAVBAR_LOGOS");
};

export const getPartnerLogos = (): LogoConfig[] => {
  return getLogoConfigs("PARTNER_LOGOS");
};

export const getThemeCssVariables = (): Record<string, string> => {
  const raw = getEnv("FRONTEND_THEME_CSS_VARIABLES");
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw);
    const isValid =
      typeof parsed === "object" &&
      parsed !== null &&
      !Array.isArray(parsed) &&
      Object.values(parsed).every((value) => typeof value === "string");
    if (isValid) {
      return parsed;
    }
    console.warn(
      `Invalid FRONTEND_THEME_CSS_VARIABLES "${raw}", expected a JSON object of string values. Falling back to default.`
    );
    return {};
  } catch (e) {
    console.warn(
      `Invalid FRONTEND_THEME_CSS_VARIABLES "${raw}", expected a JSON object of string values. Falling back to default.`,
      e
    );
    return {};
  }
};

export const getBrowserTabTitle = () => {
  return getEnv("FRONTEND_BROWSER_TAB_TITLE");
};

export const getFaviconUrl = () => {
  return getEnv("FRONTEND_FAVICON_URL");
};

export const getAppIconUrl = () => {
  return getEnv("FRONTEND_APP_ICON_URL");
};

export interface LandingPageCopy {
  eyebrow?: { text: string; color?: string };
  heading?: string;
  description?: string;
  ctaCaption?: string;
  readMoreLink?: { text?: string; url?: string };
}

const isValidEyebrow = (value: unknown): value is NonNullable<LandingPageCopy["eyebrow"]> => {
  if (typeof value !== "object" || value === null) return false;
  const eyebrow = value as Record<string, unknown>;
  return typeof eyebrow.text === "string" && (eyebrow.color === undefined || typeof eyebrow.color === "string");
};

const isValidReadMoreLink = (value: unknown): value is NonNullable<LandingPageCopy["readMoreLink"]> => {
  if (typeof value !== "object" || value === null) return false;
  const link = value as Record<string, unknown>;
  return (
    (link.text === undefined || typeof link.text === "string") &&
    (link.url === undefined || typeof link.url === "string")
  );
};

const isValidLandingPageCopy = (value: unknown): value is LandingPageCopy => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const copy = value as Record<string, unknown>;
  return (
    (copy.eyebrow === undefined || isValidEyebrow(copy.eyebrow)) &&
    (copy.heading === undefined || typeof copy.heading === "string") &&
    (copy.description === undefined || typeof copy.description === "string") &&
    (copy.ctaCaption === undefined || typeof copy.ctaCaption === "string") &&
    (copy.readMoreLink === undefined || isValidReadMoreLink(copy.readMoreLink))
  );
};

export const getLandingPageCopy = (): LandingPageCopy => {
  const raw = getEnv("FRONTEND_LANDING_COPY");
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw);
    if (isValidLandingPageCopy(parsed)) {
      return parsed;
    }
    console.warn(`Invalid FRONTEND_LANDING_COPY "${raw}". Falling back to default.`);
    return {};
  } catch (e) {
    console.warn(`Invalid FRONTEND_LANDING_COPY "${raw}". Falling back to default.`, e);
    return {};
  }
};

export interface LandingPageStat {
  value: string;
  description: string;
}

const isValidLandingPageStat = (value: unknown): value is LandingPageStat => {
  if (typeof value !== "object" || value === null) return false;
  const stat = value as Record<string, unknown>;
  return typeof stat.value === "string" && stat.value.length > 0 && typeof stat.description === "string";
};

export const getLandingPageStats = (): LandingPageStat[] => {
  const raw = getEnv("FRONTEND_LANDING_STATS");
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every(isValidLandingPageStat)) {
      return parsed;
    }
    console.warn(
      `Invalid FRONTEND_LANDING_STATS "${raw}", expected a JSON array of { value, description } objects. Falling back to default.`
    );
    return [];
  } catch (e) {
    console.warn(
      `Invalid FRONTEND_LANDING_STATS "${raw}", expected a JSON array of { value, description } objects. Falling back to default.`,
      e
    );
    return [];
  }
};

export interface ApiDocsConfig {
  apiBaseUrl?: string;
  credentialsUrl?: string;
  exampleModel?: { id?: string; label?: string };
  guide?: { url?: string; label?: string };
}

// True for an absent value, or an object whose given keys are all absent-or-string.
const isOptionalStringRecord = (value: unknown, keys: string[]) => {
  if (value === undefined) return true;
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return keys.every((key) => record[key] === undefined || typeof record[key] === "string");
};

const isValidApiDocsConfig = (value: unknown): value is ApiDocsConfig => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const config = value as Record<string, unknown>;
  return (
    (config.apiBaseUrl === undefined || typeof config.apiBaseUrl === "string") &&
    (config.credentialsUrl === undefined || typeof config.credentialsUrl === "string") &&
    isOptionalStringRecord(config.exampleModel, ["id", "label"]) &&
    isOptionalStringRecord(config.guide, ["url", "label"])
  );
};

export const getApiDocsConfig = (): ApiDocsConfig => {
  const raw = getEnv("FRONTEND_API_DOCS");
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw);
    if (isValidApiDocsConfig(parsed)) {
      return parsed;
    }
    console.warn(
      `Invalid FRONTEND_API_DOCS "${raw}", expected a JSON object of string values. Falling back to default.`
    );
    return {};
  } catch (e) {
    console.warn(
      `Invalid FRONTEND_API_DOCS "${raw}", expected a JSON object of string values. Falling back to default.`,
      e
    );
    return {};
  }
};
