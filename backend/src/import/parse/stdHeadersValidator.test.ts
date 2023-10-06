import "_test_utilities/consoleMock";

import { getStdHeadersValidator } from "./stdHeadersValidator";
import importLogger from "import/importLogger/importLogger";

describe("getStdHeadersValidator", () => {
  beforeAll(() => {
    jest.spyOn(importLogger, "logError");
    jest.spyOn(importLogger, "logWarning");
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("call getStdHeadersValidator should return a function", () => {
    // GIVEN a validator name
    const givenValidatorName = "validatorName";
    // AND headers
    const expectedHeaders = ["header1", "header2"];

    // WHEN getStdHeadersValidator is called with valid params
    const headersValidator = getStdHeadersValidator(
      givenValidatorName,
      expectedHeaders
    );

    // THEN a validator should be function
    expect(typeof headersValidator).toBe("function");
  });

  test("should return true when actual headers include all expected headers", async () => {
    // GIVEN a validator name
    const givenValidatorName = "validatorName";
    // AND expect expected headers present
    const expectedHeaders = ["header1", "header2"];

    // WHEN getStdHeadersValidator is called with valid params
    const headersValidator = getStdHeadersValidator(
      givenValidatorName,
      expectedHeaders
    );
    // AND received actual headers

    const actualHeaders = ["header1", "header2", "header3"];
    //  THEN headersValidator should validate correctly
    const result = await headersValidator(actualHeaders);
    expect(result).toBe(true);
    // AND no error should be logged
    expect(importLogger.logError).not.toHaveBeenCalled();
    // AND no warning should be logged
    expect(importLogger.logWarning).not.toHaveBeenCalled();
  });

  test("should return false when actual headers do not include all expected headers", async () => {
    // GIVEN a validator name
    const givenValidatorName = "validatorName";
    // AND expect expected headers present
    const expectedHeaders = ["header1", "header2", "header3"];

    // WHEN getStdHeadersValidator is called with valid params
    const headersValidator = getStdHeadersValidator(
      givenValidatorName,
      expectedHeaders
    );
    // AND received actual headers
    const actualHeaders = ["header1"];

    //  THEN headersValidator should validate correctly
    const result = await headersValidator(actualHeaders);
    expect(result).toBe(false);
    // AND an error should be logged
    expect(importLogger.logError).toHaveBeenCalledWith(
      `Failed to validate header for ${givenValidatorName}, expected to include header header2`
    );
    expect(importLogger.logError).toHaveBeenCalledWith(
      `Failed to validate header for ${givenValidatorName}, expected to include header header3`
    );
  });
});
