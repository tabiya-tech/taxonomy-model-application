describe("test with Error", () => {
  test.each([
    [
      "correct string error and string cause",
      "error message",
      "cause message",
      new Error("error message", { cause: new Error("cause message") }),
    ],
    [
      "correct regex error and string cause",
      /error message/,
      "cause message",
      new Error("error message", { cause: new Error("cause message") }),
    ],
    [
      "correct string error and regex cause",
      "error message",
      /cause message/,
      new Error("error message", { cause: new Error("cause message") }),
    ],
    [
      "correct regex error and regex cause",
      /error message/,
      /cause message/,
      new Error("error message", { cause: new Error("cause message") }),
    ],
    [
      "correct string error that looks like a regex and string cause",
      "*:*@error",
      "cause message",
      new Error("*:*@error", { cause: new Error("cause message") }),
    ],
    [
      "correct string error and string cause that looks like a regex",
      "error message",
      "*:*@cause",
      new Error("error message", { cause: new Error("*:*@cause") }),
    ],
    [
      "correct string error that looks like a regex and string cause that looks like a regex",
      "*:*@error",
      "*:*@cause",
      new Error("*:*@error", { cause: new Error("*:*@cause") }),
    ],
    [
      "correct jest asymmetric matcher error and string cause",
      expect.stringMatching(/error message/),
      "cause message",
      new Error("error message", { cause: new Error("cause message") }),
    ],
    [
      "correct string error and jest asymmetric matcher cause",
      "error message",
      expect.stringMatching(/cause message/),
      new Error("error message", { cause: new Error("cause message") }),
    ],
    [
      "correct jest asymmetric matcher error and jest asymmetric matcher cause",
      expect.stringMatching(/error message/),
      expect.stringMatching(/cause message/),
      new Error("error message", { cause: new Error("cause message") }),
    ],
    [
      "jest asymmetric matcher expect.any(String) error and string cause",
      expect.any(String),
      "cause message",
      new Error("error message", { cause: new Error("cause message") }),
    ],
    [
      "string error and jest asymmetric matcher expect.any(String) cause",
      "error message",
      expect.any(String),
      new Error("error message", { cause: new Error("cause message") }),
    ],
    [
      "jest asymmetric matcher expect.any(String) error and jest asymmetric matcher expect.any(String) cause",
      expect.any(String),
      expect.any(String),
      new Error("error message", { cause: new Error("cause message") }),
    ],
    [
      "jest asymmetric matcher expect.anything() error and string cause",
      expect.anything(),
      "cause message",
      new Error("error message", { cause: new Error("cause message") }),
    ],
    [
      "string error and jest asymmetric matcher expect.anything() cause",
      "error message",
      expect.anything(),
      new Error("error message", { cause: new Error("cause message") }),
    ],
    [
      "jest asymmetric matcher expect.anything() error and jest asymmetric matcher expect.anything() cause",
      expect.anything(),
      expect.anything(),
      new Error("error message", { cause: new Error("cause message") }),
    ],
    ["correct string error and undefined cause", "error message", undefined, new Error("error message")],
    ["correct regex error and undefined cause", /error message/, undefined, new Error("error message")],
    [
      "correct jest asymmetric matcher error and undefined cause",
      expect.stringMatching(/error message/),
      undefined,
      new Error("error message"),
    ],
    [
      "jest asymmetric matcher expect.any(String) error and undefined cause",
      expect.any(String),
      undefined,
      new Error("error message"),
    ],
    [
      "jest asymmetric matcher expect.anything() error and undefined cause",
      expect.anything(),
      undefined,
      new Error("error message"),
    ],
  ])(
    `should work as expected when it receives a %s`,
    (
      _description: string,
      givenErrorMessage: string | RegExp | jest.AsymmetricMatcher,
      givenCauseMessage: string | RegExp | jest.AsymmetricMatcher | undefined,
      actualError
    ) => {
      // GIVEN an error with a given error and cause
      // WHEN the error is matched with the given error and cause in myriad ways
      // THEN the error should be matched as expected
      expect(actualError).toMatchErrorWithCause(givenErrorMessage, givenCauseMessage);
      expect(() => {
        throw actualError;
      }).toThrowError(expect.toMatchErrorWithCause(givenErrorMessage, givenCauseMessage));
      expect(() => {
        throw actualError;
      }).not.toThrowError(expect.toMatchErrorWithCause("wrong error", givenCauseMessage));
      expect(() => {
        throw actualError;
      }).not.toThrowError(expect.toMatchErrorWithCause(givenErrorMessage, "wrong cause"));
      expect(() => {
        throw actualError;
      }).not.toThrowError(expect.toMatchErrorWithCause("wrong error", "wrong cause"));
    }
  );
});
