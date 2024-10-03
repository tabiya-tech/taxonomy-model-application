// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";
import "@testing-library/jest-dom/extend-expect";

// jest extended adds more matchers
// allows you to do things like:
// expect().toHaveBeenCalledBefore();
// learn more: https://jest-extended.jestcommunity.dev/docs/
import "jest-extended/all";

// We are mocking these modules (unist-util-visit-parents and react-markdown)
// because they have issues when used with Jest and TypeScript
// So are not compatible with Jest, Typescript and modern ESM.
// The solution for now is to mock them during tests.
// for more information check the following links:
//  - https://github.com/orgs/remarkjs/discussions/1247
jest.mock("unist-util-visit-parents", () => ({}));
jest.mock("react-markdown", () => {
  return jest.fn().mockImplementation((props) => {
    return <span {...props} />;
  });
});
