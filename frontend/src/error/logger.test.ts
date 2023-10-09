import { ServiceError } from "./error";
import { ErrorCodes } from "./errorCodes";
import { writeServiceErrorToLog } from "./logger";

describe("Test writeServiceErrorToLog", () => {
  test("should write to log", () => {
    const err = new ServiceError(
      "service",
      "function",
      "method",
      "path",
      400,
      ErrorCodes.API_ERROR,
      "message",
      new Error()
    );
    const logFunction = jest.fn();
    writeServiceErrorToLog(err, logFunction);
    expect(logFunction).toBeCalledTimes(1);
  });
});
