import { render, screen } from "src/_test_utilities/test-utils";
import AuthAPISpecs from "api-specifications/auth";
import { mockLoggedInUser } from "./mockLoggedInUser";

export const ALL_USERS = [
  AuthAPISpecs.Enums.TabiyaRoles.ANONYMOUS,
  AuthAPISpecs.Enums.TabiyaRoles.REGISTERED_USER,
  AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER,
];

type AuthorizationTestsParams = {
  name: string;
  Component: JSX.Element;
  testIds?: string[];
  roles?: AuthAPISpecs.Enums.TabiyaRoles[];
  tests?: Partial<
    Record<
      AuthAPISpecs.Enums.TabiyaRoles,
      {
        visible?: string[];
        hidden?: string[];
        visibleDisabled?: string[];
      }
    >
  >;
};

/**
 * This function is used to test the rendering of a component based on different user roles.
 * It takes an object as a parameter which includes the name of the test, the Component to be tested,
 * an array of testIds, an array of roles and a tests object.
 *
 * @param {AuthorizationTestsParams} params - The parameters for the test
 * @param {string} params.name - The name of the test
 * @param {React.Component} params.Component - The component to be tested
 * @param {string[]} params.testIds - The testIds of the elements in the component
 * @param {string[]} params.roles - The roles for which the component should be tested
 * @param {object} params.tests - The tests to be performed on the component
 *
 * @returns {Function} - A function that runs the tests
 */
export const authorizationTests = {
  defaultName: "Test the rendering of the component based on Roles",
  callback: ({ name, Component, testIds = [], roles = ALL_USERS, tests }: AuthorizationTestsParams) => {
    return () => {
      // For each role, we run a test
      test.each(roles?.map((role) => [role]))(`${name} renders correctly for user with role %s`, (role) => {
        // We define the common elements that should be present in the component
        const commonElements = testIds || [];
        // We get the tests for the current role, if a test is not defined, we default to an empty object, and if any field is not defined, we default that field to an empty array
        const { visible = [], visibleDisabled = [], hidden = [] } = tests?.[role] || {};

        // We mock a logged in user with the current role
        mockLoggedInUser({ user: { username: "foo", roles: [role] } });

        // We render the component
        render(Component);

        // We check that the common elements are in the document
        commonElements.forEach((testId) => expect(screen.getByTestId(testId)).toBeInTheDocument());

        // We check that the elements that should be visible are visible
        visible?.forEach((testId) => {
          expect(screen.getByTestId(testId)).toBeVisible();
        });

        // We check that the elements that should be hidden are not in the document
        hidden?.forEach((testId) => {
          expect(screen.queryByTestId(testId)).not.toBeInTheDocument();
        });

        // Check that elements that should be visible and disabled are visible and disabled
        visibleDisabled.forEach((testId) => {
          const element = screen.getByTestId(testId);
          expect(element).toBeVisible();
          expect(element).toBeDisabled();
        });
      });
    };
  },
};
