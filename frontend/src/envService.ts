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
