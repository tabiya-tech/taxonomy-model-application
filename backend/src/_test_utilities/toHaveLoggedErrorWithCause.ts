import "_test_utilities/consoleMock";
expect.extend({
  toHaveLoggedErrorWithCause(received, expectedMessage, expectedCause) {
    const calls = received.mock.calls;
    for (const call of calls) {
      const errorArg = call[0];
      if (errorArg instanceof Error && errorArg.message === expectedMessage && errorArg.cause === expectedCause) {
        return {
          message: () =>
            `expected console.error not to have been called with error message "${expectedMessage}" and cause`,
          pass: true,
        };
      }
    }

    return {
      message: () => `expected console.error to have been called with error message "${expectedMessage}" and cause`,
      pass: false,
    };
  },
});

expect.extend({
  toHaveNthLoggedErrorWithCause(received, nthCall, expectedMessage, expectedCause) {
    const calls = received.mock.calls;

    // Check if the nth call exists
    if (calls.length < nthCall || nthCall < 1) {
      return {
        message: () => `expected console.error to have been called at least ${nthCall} times`,
        pass: false,
      };
    }

    // Retrieve the nth call
    const call = calls[nthCall - 1];
    const errorArg = call[0];

    // Check if the errorArg matches the expected message and cause
    if (errorArg.message === expectedMessage && compareErrorProperties(errorArg.cause, expectedCause)) {
      return {
        message: () =>
          `expected console.error not to have been called the ${nthCall}th time with error message "${expectedMessage}" and cause`,
        pass: true,
      };
    }

    return {
      message: () =>
        `expected console.error to have been called the ${nthCall}th time with error message "${expectedMessage}" and cause. Instead found message: ${errorArg.message} \n and cause ${errorArg.cause} `,
      pass: false,
    };
  },
});

const compareErrorProperties = (received: Error, expected: Error): boolean => {
  return (
    received.message === expected.message &&
    (expected.cause && received.cause && expected.cause instanceof Error && received.cause instanceof Error
      ? compareErrorProperties(received.cause, expected.cause)
      : true)
  );
};

export {};
