// jest.d.ts
import 'jest';


declare global {
  namespace jest {
    interface Expect {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toMatchErrorWithCause(expectedMessage: RegExp | string | jest.AsymmetricMatcher, expectedCause: RegExp | string | jest.AsymmetricMatcher | undefined): any ;
    }

    interface Matchers<R> {
      toMatchErrorWithCause(expectedMessage: RegExp | string | jest.AsymmetricMatcher, expectedCause: RegExp | string | jest.AsymmetricMatcher | undefined): R ;
    }
  }
}

