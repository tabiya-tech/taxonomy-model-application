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
