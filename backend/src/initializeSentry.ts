import * as Sentry from "@sentry/aws-serverless";

const getLogLevelFromEnvironment = (environment: string | undefined) => {
  switch (environment) {
    // on production environment, only log warnings
    case "prod":
      return ["warn"];
    // on dev environment, log warnings and errors
    case "dev":
      return ["warn", "error"];
    default:
      return [];
  }
};

export const initializeSentry = (identifier: string) => {
  Sentry.init({
    dsn: process.env.SENTRY_BACKEND_DSN! ?? "",
    tracesSampleRate: 1.0,
    integrations: [
      Sentry.captureConsoleIntegration({
        levels: getLogLevelFromEnvironment(process.env.TARGET_ENVIRONMENT),
      }),
    ],
    environment: process.env.TARGET_ENVIRONMENT!,
    attachStacktrace: true,
  });
  Sentry.withScope((scope) => {
    scope.setTag("lambda::", identifier);
  });
};
