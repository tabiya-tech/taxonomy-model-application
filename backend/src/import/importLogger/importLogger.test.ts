// mock the console
import "_test_utilities/consoleMock";

describe("Test importLogger", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test("when module is imported it should return a logger singleton instance", () => {
    jest.isolateModules(() => {
      // WHEN the module is imported twice

      const importLogger1 = require("./importLogger");
      const importLogger2 = require("./importLogger");

      // THEN the module should return the same instance
      expect(importLogger1.default).toBeDefined();
      expect(importLogger2.default).toBeDefined();
      expect(importLogger1.default).toBe(importLogger2.default);
      importLogger1.default.logError("error");
    });
  });

  test("when no errors or warnings are logged, the errorCount and warningCount should be 0", () => {
    jest.isolateModules(() => {
      // GIVEN the logger is imported
      const importLogger = require("./importLogger");
      // WHEN no errors or warnings are logged
      // THEN the errorCount and warningCount should be 0
      expect(importLogger.default.errorCount).toBe(0);
      expect(importLogger.default.warningCount).toBe(0);
    });
  });

  test("should count logged errors", () => {
    jest.isolateModules(() => {
      // GIVEN the logger is imported
      const importLogger = require("./importLogger");
      // WHEN N errors are logged
      const N = 3;
      for (let i = 0; i < N; i++) {
        importLogger.default.logError(new Error("error" + i));
      }
      // THEN the errorCount should be N
      expect(importLogger.default.errorCount).toBe(N);
      // AND the warningCount should be 0
      expect(importLogger.default.warningCount).toBe(0);
    });
  });

  test("should count logged warnings", () => {
    jest.isolateModules(() => {
      // GIVEN the logger is imported
      const importLogger = require("./importLogger");
      // WHEN N warnings are logged
      const N = 3;
      for (let i = 0; i < N; i++) {
        importLogger.default.logWarning(new Error("error" + i));
      }
      // THEN the warningCount should be N
      expect(importLogger.default.warningCount).toBe(N);
      // AND the errorCount should be 0
      expect(importLogger.default.errorCount).toBe(0);
    });
  });

  test("should log error to the console", () => {
    jest.isolateModules(() => {
      // GIVEN the logger is imported
      const importLogger = require("./importLogger");
      // AND an error
      const givenError = new Error("error");
      // AND a message
      const givenMessage = "message";

      // WHEN the message and error is logged as a warning
      importLogger.default.logError(givenMessage, givenError);

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
      const importLogger = require("./importLogger");
      // AND an error
      const givenError = new Error("error");
      // AND a message
      const givenMessage = "message";

      // WHEN the message and error is logged as a warning
      importLogger.default.logWarning(givenMessage, givenError);

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
      const importLogger = require("./importLogger");
      // AND an error
      const givenError = new Error("error");

      // WHEN and error and a warning are logged
      importLogger.default.logWarning(givenError);
      importLogger.default.logError(givenError);
      // AND the errorCount and warningCount are cleared
      importLogger.default.clear();

      // THEN the warningCount and errorCount should be 0
      expect(importLogger.default.warningCount).toBe(0);
      expect(importLogger.default.errorCount).toBe(0);
    });
  });
});
