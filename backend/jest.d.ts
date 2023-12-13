// jest.d.ts
import 'jest';

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveLoggedErrorWithCause(expectedMessage: string, expectedCause: Error): R;
      toHaveNthLoggedErrorWithCause(nthCall: number, expectedMessage: string, expectedCause: Error): R;
    }
  }
}
