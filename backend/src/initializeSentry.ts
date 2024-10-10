import * as Sentry from "@sentry/aws-serverless";

export const initializeSentry = () => {
  Sentry.init({
    dsn: process.env.SENTRY_BACKEND_DSN ?? "",
    tracesSampleRate: 1.0,
    integrations: [
      Sentry.captureConsoleIntegration({
        levels: ["error", "warn"], // "log", "info" // TODO: allow adjusting this according to the environment
      }),
    ],
    environment: process.env.TARGET_ENVIRONMENT,
  });
};
