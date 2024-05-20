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

export const authorizationTests = {
  defaultName: "Test the rendering of the component based on Roles",
  callback: ({ name, Component, testIds = [], roles = ALL_USERS, tests }: AuthorizationTestsParams) => {
    return () => {
      test.each(roles?.map((role) => [role]))(`${name} renders correctly for user with role %s`, (role) => {
        const commonElements = testIds || [];
        const { visible = [], visibleDisabled = [], hidden = [] } = tests?.[role] || {};

        mockLoggedInUser({ user: { username: "foo", roles: [role] } });

        render(Component);

        commonElements.forEach((testId) => expect(screen.getByTestId(testId)).toBeInTheDocument());

        visible?.forEach((testId) => {
          expect(screen.getByTestId(testId)).toBeVisible();
        });

        hidden?.forEach((testId) => {
          expect(screen.queryByTestId(testId)).not.toBeInTheDocument();
        });

        visibleDisabled?.forEach((testId) => {
          const element = screen.getByTestId(testId);
          expect(element).toBeVisible();
          if (element instanceof HTMLInputElement) {
            expect(element).toBeDisabled();
          }
        });
      });
    };
  },
};
