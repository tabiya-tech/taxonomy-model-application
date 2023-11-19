// mock the console
import "_test_utilities/consoleMock";

describe("Test importLogger", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test("when module is imported it should return a logger singleton instance", () => {
    jest.isolateModules(() => {
      // WHEN the module is imported twice

      const errorLogger1 = require("./errorLogger");
      const errorLogger2 = require("./errorLogger");

      // THEN the module should return the same instance
      expect(errorLogger1.default).toBeDefined();
      expect(errorLogger2.default).toBeDefined();
      expect(errorLogger1.default).toBe(errorLogger2.default);
      errorLogger1.default.logError("error");
    });
  });

  test("when no errors or warnings are logged, the errorCount and warningCount should be 0", () => {
    jest.isolateModules(() => {
      // GIVEN the logger is imported
      const errorLogger = require("./errorLogger");
      // WHEN no errors or warnings are logged
      // THEN the errorCount and warningCount should be 0
      expect(errorLogger.default.errorCount).toBe(0);
      expect(errorLogger.default.warningCount).toBe(0);
    });
  });

  test("should count logged errors", () => {
    jest.isolateModules(() => {
      // GIVEN the logger is imported
      const errorLogger = require("./errorLogger");
      // WHEN N errors are logged
      const N = 3;
      for (let i = 0; i < N; i++) {
        errorLogger.default.logError(new Error("error" + i));
      }
      // THEN the errorCount should be N
      expect(errorLogger.default.errorCount).toBe(N);
      // AND the warningCount should be 0
      expect(errorLogger.default.warningCount).toBe(0);
    });
  });

  test("should count logged warnings", () => {
    jest.isolateModules(() => {
      // GIVEN the logger is imported
      const errorLogger = require("./errorLogger");
      // WHEN N warnings are logged
      const N = 3;
      for (let i = 0; i < N; i++) {
        errorLogger.default.logWarning(new Error("error" + i));
      }
      // THEN the warningCount should be N
      expect(errorLogger.default.warningCount).toBe(N);
      // AND the errorCount should be 0
      expect(errorLogger.default.errorCount).toBe(0);
    });
  });

  test("should log error to the console", () => {
    jest.isolateModules(() => {
      // GIVEN the logger is imported
      const errorLogger = require("./errorLogger");
      // AND an error
      const givenError = new Error("error");
      // AND a message
      const givenMessage = "message";

      // WHEN the message and error is logged as a warning
      errorLogger.default.logError(givenMessage, givenError);

      // THEN the error should be logged in the console
      expect(console.error).toBeCalledTimes(1);
      expect(console.error).toBeCalledWith(givenMessage, givenError);
      // AND no warning should be logged in the console
      expect(console.warn).toBeCalledTimes(0);
    });
  });

  test("should log warning to the console", () => {
    jest.isolateModules(() => {
      // GIVEN the logger is imported
      const errorLogger = require("./errorLogger");
      // AND an error
      const givenError = new Error("error");
      // AND a message
      const givenMessage = "message";

      // WHEN the message and error is logged as a warning
      errorLogger.default.logWarning(givenMessage, givenError);

      // THEN the warning should be logged in the console
      expect(console.warn).toBeCalledTimes(1);
      expect(console.warn).toBeCalledWith(givenMessage, givenError);
      // AND no error should be logged in the console
      expect(console.error).toBeCalledTimes(0);
    });
  });

  test("should clear the errorCount and warningCount", () => {
    jest.isolateModules(() => {
      // GIVEN the logger is imported
      const errorLogger = require("./errorLogger");
      // AND an error
      const givenError = new Error("error");

      // WHEN and error and a warning are logged
      errorLogger.default.logWarning(givenError);
      errorLogger.default.logError(givenError);
      // AND the errorCount and warningCount are cleared
      errorLogger.default.clear();

      // THEN the warningCount and errorCount should be 0
      expect(errorLogger.default.warningCount).toBe(0);
      expect(errorLogger.default.errorCount).toBe(0);
    });
  });
});
