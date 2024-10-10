import * as Sentry from "@sentry/aws-serverless";
import { initializeSentry } from "./initializeSentry";

jest.mock("@sentry/aws-serverless", () => ({
  init: jest.fn(),
  captureConsoleIntegration: jest.fn(),
}));

describe("initializeSentry", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should initialize Sentry with the correct configuration", () => {
    // GIVEN the environment variables are set
    const givenDSN = "https://example.com/sentry";
    const givenEnvironment = "test";
    process.env.SENTRY_BACKEND_DSN = givenDSN;
    process.env.TARGET_ENVIRONMENT = givenEnvironment;
    // AND the captureConsoleIntegration is mocked
    const givenCaptureConsoleIntegration = jest.fn();
    jest.spyOn(Sentry, "captureConsoleIntegration").mockReturnValue(givenCaptureConsoleIntegration);

    // WHEN initializeSentry is called
    initializeSentry();

    // THEN expect Sentry.init to be called with the correct configuration
    expect(Sentry.init).toHaveBeenCalledWith({
      dsn: givenDSN,
      tracesSampleRate: 1.0,
      integrations: [givenCaptureConsoleIntegration],
      environment: givenEnvironment,
    });
  });

  test("should initialize Sentry with an empty DSN if the environment variable is not set", () => {
    // GIVEN the SENTRY_BACKEND_DSN environment variable is not set
    delete process.env.SENTRY_BACKEND_DSN;

    // WHEN initializeSentry is called
    initializeSentry();

    // THEN expect Sentry.init to be called with an empty DSN
    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: "",
      })
    );
  });

  test("should initialize Sentry with captureConsoleIntegration", () => {
    // WHEN initializeSentry is called
    initializeSentry();

    // THEN expect Sentry.captureConsoleIntegration to be called with the correct options
    expect(Sentry.captureConsoleIntegration).toHaveBeenCalledWith({
      levels: ["error", "warn"],
    });
  });
});
