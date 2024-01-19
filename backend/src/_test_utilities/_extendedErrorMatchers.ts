import { ExtendedError } from "extendedError.types";
import type { MatcherFunction } from "expect";
import { diff } from "jest-diff";

type MatchablePattern = RegExp | string | jest.AsymmetricMatcher;

/**
 * Custom Jest matcher to verify that an Error has a specific message and a specific cause. Can be used as an asymmetric matcher, and chained with jest.throwsError(), .not() ... etc.
 *
 * @param {Error | (() => unknown)} received - The function to be tested.
 * @param {RegExp | string | jest.AsymmetricMatcher} expectedErrorPattern - The expected message of the error.
 * @param {RegExp | string | jest.AsymmetricMatcher} expectedCausePattern - The expected cause of the error.
 * @returns  Result object for Jest matcher.
 *
 * @example
 * const err = new Error("error message", { cause: new Error("cause message") });
 * expect(err).toMatchErrorWithCause("error message", "cause message");
 * @example
 * expect(() => {throw new Error("error message", { cause: new Error("cause message") })}).toThrowError(expect.toMatchErrorWithCause("error message", "cause message"));
 */
export const toMatchErrorWithCause: MatcherFunction<
  [expectedErrorPattern: MatchablePattern, expectedCausePattern: MatchablePattern | undefined]
> = function (
  received: unknown,
  expectedErrorPattern: MatchablePattern,
  expectedCausePattern: MatchablePattern | undefined
) {
  const options = {
    comment: "Error message and cause message must match the expected patterns",
    isNot: this.isNot,
    promise: this.promise,
  };

  if (!isAllowedErrorArgument(expectedErrorPattern)) {
    throw new TypeError("expected error pattern must be of type: string or RegExp or jest.AsymmetricMatcher");
  }
  if (!isAllowedCauseArgument(expectedCausePattern)) {
    throw new TypeError(
      "expected cause pattern must be of type: string or RegExp or jest.AsymmetricMatche or undefined"
    );
  }
  if (!(received instanceof Error)) {
    throw new TypeError("received must be an Error");
  }

  const receivedError: ExtendedError = received as ExtendedError;
  const actualErrorProperties = { message: received.message, cause: receivedError.cause?.message };
  const expectedErrorProperties = { message: expectedErrorPattern, cause: expectedCausePattern };

  // Verify the error
  const { isMessageMatch, isCauseMatch } = compareActualAndExpected(actualErrorProperties, expectedErrorProperties);
  const pass = isMessageMatch && isCauseMatch;

  const message = pass
    ? () =>
        this.utils.matcherHint("toMatchErrorWithCause", undefined, undefined, options) +
        "\n\n" +
        `Expected: NOT ${this.utils.printExpected(expectedErrorProperties)}\n` +
        `Received: ${this.utils.printReceived(actualErrorProperties)}`
    : () => {
        const diffString = diff(actualErrorProperties, expectedErrorProperties, {
          expand: this.expand,
        });
        return (
          this.utils.matcherHint("toMatchErrorWithCause", undefined, undefined, options) +
          "\n\n" +
          `Difference:\n\n${diffString}\n\n` +
          `Expected: ${this.utils.printExpected(expectedErrorProperties)}\n` +
          `Received: ${this.utils.printReceived(actualErrorProperties)}`
        );
      };

  return { actual: actualErrorProperties, message, pass };
};

function isAllowedErrorArgument(object: unknown): boolean {
  return typeof object === "string" || isRexExp(object) || isAsymmetricMatcher(object);
}

function isAllowedCauseArgument(object: unknown): boolean {
  return typeof object === "undefined" || typeof object === "string" || isRexExp(object) || isAsymmetricMatcher(object);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isAsymmetricMatcher(object: any): object is jest.AsymmetricMatcher {
  return !!object && typeof object.asymmetricMatch === "function";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isRexExp(object: any): object is RegExp {
  return object instanceof RegExp;
}

/*
 * Helper function to verify that an error matches the expected message and cause.
 */
function compareActualAndExpected(
  actual: { message: string; cause?: string },
  expected: { message: MatchablePattern; cause: MatchablePattern | undefined }
): { isMessageMatch: boolean; isCauseMatch: boolean } {
  let isMessageMatch;
  if (isRexExp(expected.message)) {
    isMessageMatch = RegExp(expected.message).test(actual.message);
  } else if (isAsymmetricMatcher(expected.message)) {
    isMessageMatch = expected.message.asymmetricMatch(actual.message);
  } else {
    isMessageMatch = actual.message === expected.message;
  }

  let isCauseMatch;
  if (expected.cause === undefined) {
    isCauseMatch = actual.cause === undefined;
  } else if (isRexExp(expected.cause)) {
    isCauseMatch = !!actual.cause && RegExp(expected.cause).test(actual.cause);
  } else if (isAsymmetricMatcher(expected.cause)) {
    isCauseMatch = !!actual.cause && expected.cause.asymmetricMatch(actual.cause);
  } else {
    isCauseMatch = actual.cause === expected.cause;
  }
  return { isMessageMatch, isCauseMatch };
}

expect.extend({
  toMatchErrorWithCause,
});
