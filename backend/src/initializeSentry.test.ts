import * as Sentry from "@sentry/aws-serverless";
import { initializeSentry } from "./initializeSentry";

jest.mock("@sentry/aws-serverless", () => ({
  init: jest.fn(),
  captureConsoleIntegration: jest.fn(),
  withScope: jest.fn(),
}));

describe("initializeSentry", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should initialize Sentry with the correct configuration", () => {
    const givenIdentifier = "foo";
    const givenDSN = "https://example.com/sentry";
    const givenEnvironment = "test";
    // GIVEN the environment variables are set
    process.env.SENTRY_BACKEND_DSN = givenDSN;
    process.env.TARGET_ENVIRONMENT = givenEnvironment;
    // AND the captureConsoleIntegration is mocked
    const givenCaptureConsoleIntegration = jest.fn();
    jest.spyOn(Sentry, "captureConsoleIntegration").mockReturnValue(givenCaptureConsoleIntegration);

    // WHEN initializeSentry is called
    initializeSentry(givenIdentifier);

    // THEN expect Sentry.init to be called with the correct configuration
    expect(Sentry.init).toHaveBeenCalledWith({
      dsn: givenDSN,
      tracesSampleRate: 1.0,
      integrations: [givenCaptureConsoleIntegration],
      environment: givenEnvironment,
      attachStacktrace: true,
    });
  });

  test("should initialize Sentry with an empty DSN if the environment variable is not set", () => {
    const givenIdentifier = "foo";
    // GIVEN the SENTRY_BACKEND_DSN environment variable is not set
    delete process.env.SENTRY_BACKEND_DSN;

    // WHEN initializeSentry is called
    initializeSentry(givenIdentifier);

    // THEN expect Sentry.init to be called with an empty DSN
    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: "",
      })
    );
  });

  test.each([
    ["prod", ["warn"]],
    ["dev", ["warn", "error"]],
    ["unknown", []],
  ])("should initialize Sentry with captureConsoleIntegration for %s environment", (environment, expectedLevels) => {
    const givenIdentifier = "foo";
    // GIVEN the environment variable is set
    process.env.TARGET_ENVIRONMENT = environment;

    // WHEN initializeSentry is called
    initializeSentry(givenIdentifier);

    // THEN expect Sentry.captureConsoleIntegration to be called with the correct options
    expect(Sentry.captureConsoleIntegration).toHaveBeenCalledWith({
      levels: expectedLevels,
    });
  });

  test("should set the lambda identifier as a tag", () => {
    const givenIdentifier = "foo";

    // WHEN initializeSentry is called
    initializeSentry(givenIdentifier);

    // THEN expect Sentry.withScope to be called with the correct lambda identifier tag
    expect(Sentry.withScope).toHaveBeenCalledWith(expect.any(Function));
    const scopeFunction = (Sentry.withScope as jest.Mock).mock.calls[0][0];
    const mockScope = { setTag: jest.fn() };
    scopeFunction(mockScope);
    expect(mockScope.setTag).toHaveBeenCalledWith("lambda::", givenIdentifier);
  });
});
