// mute console.log during test
import "_test_utilities/consoleMock";

import AuthAPISpecs from "api-specifications/auth";

import { RoleRequired } from "./index";
import { StatusCodes } from "server/httpUtils";
import { AccessKeyType } from "auth/accessKey/accessKey.types";
import { getDependencyRegistry } from "auth/dependencyRegistry";

import { getRandomString } from "_test_utilities/getMockRandomData";

const TabiyaRoles = AuthAPISpecs.Enums.TabiyaRoles;

function _response(statusCode: StatusCodes) {
  return { statusCode };
}

class Resource {
  @RoleRequired(TabiyaRoles.MODEL_MANAGER)
  async modelManagerResource(_event: object) {
    return _response(StatusCodes.OK);
  }

  @RoleRequired(TabiyaRoles.REGISTERED_USER)
  async registeredUserResource(_event: object) {
    return _response(StatusCodes.OK);
  }

  @RoleRequired(TabiyaRoles.ANONYMOUS)
  async guestUserResource(_event: object) {
    return _response(StatusCodes.OK);
  }
}

type TestCase = {
  givenClientsRole: AuthAPISpecs.Enums.TabiyaRoles;
  resourceMethod: keyof Resource;
  canAccessResource: boolean;
};

const testCases: TestCase[] = [
  // MODEL MANAGER RESOURCE
  // Only model manager can access model manager resource
  {
    resourceMethod: "modelManagerResource",
    givenClientsRole: TabiyaRoles.MODEL_MANAGER,
    canAccessResource: true,
  },
  {
    resourceMethod: "modelManagerResource",
    givenClientsRole: TabiyaRoles.REGISTERED_USER,
    canAccessResource: false,
  },
  {
    resourceMethod: "modelManagerResource",
    givenClientsRole: TabiyaRoles.ANONYMOUS,
    canAccessResource: false,
  },

  // REGISTERED USER RESOURCE
  // Only model managers and registered users can access registered user resource
  {
    resourceMethod: "registeredUserResource",
    givenClientsRole: TabiyaRoles.MODEL_MANAGER,
    canAccessResource: true,
  },
  {
    resourceMethod: "registeredUserResource",
    givenClientsRole: TabiyaRoles.REGISTERED_USER,
    canAccessResource: true,
  },
  {
    resourceMethod: "registeredUserResource",
    givenClientsRole: TabiyaRoles.ANONYMOUS,
    canAccessResource: false,
  },

  // GUEST USER RESOURCE
  // Everyone can access guest user resource
  {
    resourceMethod: "guestUserResource",
    givenClientsRole: TabiyaRoles.MODEL_MANAGER,
    canAccessResource: true,
  },
  {
    resourceMethod: "guestUserResource",
    givenClientsRole: TabiyaRoles.REGISTERED_USER,
    canAccessResource: true,
  },
  {
    resourceMethod: "guestUserResource",
    givenClientsRole: TabiyaRoles.ANONYMOUS,
    canAccessResource: true,
  },
];

function constructHumanInTheLoopEvent(role: AuthAPISpecs.Enums.TabiyaRoles) {
  let authorizer = {};
  if (role == TabiyaRoles.ANONYMOUS) {
    authorizer = {};
  }

  if (role == TabiyaRoles.REGISTERED_USER) {
    authorizer = {
      authType: AuthAPISpecs.Enums.Cognito.TokenType.HUMAN_IN_THE_LOOP,
      groups: "",
    };
  }

  if (role == TabiyaRoles.MODEL_MANAGER) {
    authorizer = {
      authType: AuthAPISpecs.Enums.Cognito.TokenType.HUMAN_IN_THE_LOOP,
      groups: TabiyaRoles.MODEL_MANAGER,
    };
  }

  return {
    requestContext: {
      authorizer,
    },
  };
}

async function assertAccessRule(testCase: TestCase, event: object) {
  // WHEN the user tries to access the specified resource
  const resource = new Resource();
  const result = await resource[testCase.resourceMethod](event);

  // WHEN the user tries to access the specified resource,
  // IF they can access the resource THEN expect the response to be OK,
  if (testCase.canAccessResource) {
    expect(result.statusCode).toBe(StatusCodes.OK);

    // AND no errors should be logged.
    expect(console.error).not.toHaveBeenCalled();
  }
  // ELSE expect the response to be FORBIDDEN
  else {
    expect(result.statusCode).toBe(StatusCodes.FORBIDDEN);
  }
}

describe("Authorizer Integration tests", () => {
  beforeAll(async () => {
    const DATABASE_NAME = "AuthIntegrationTests";

    const configurations = await import("auth/config");
    jest.spyOn(configurations, "readEnvironmentConfiguration").mockReturnValue({
      dbURI: `${process.env.MONGODB_URI}${DATABASE_NAME}`,
      userPoolClientId: "given client id",
      userPoolId: "given user pool id",
    });
  });

  afterEach(() => {
    (console.error as jest.Mock).mockClear();
  });

  describe("JWT: Human in the loop", () => {
    test.each(testCases)(
      "should accessResource=$canAccessResource when the users role is $givenClientsRole and the resource is $resourceMethod",
      async (testCase) => {
        // GIVEN an event from a client with the specified role
        const event = constructHumanInTheLoopEvent(testCase.givenClientsRole);

        // WHEN the user tries to access the specified resource.
        // THEN the rule should appy
        await assertAccessRule(testCase, event);
      }
    );
  });

  describe("JWT: Machine to Machine", () => {
    test.each(testCases)(
      "should accessResource=$canAccessResource when the users role is $givenClientsRole and the resource is $resourceMethod",
      async (testCase) => {
        // GIVEN an event from a client with the specified role
        // AND a client I'd
        const givenClientId = getRandomString(20);
        const event = {
          requestContext: {
            authorizer: {
              authType: AuthAPISpecs.Enums.Cognito.TokenType.MACHINE_TO_MACHINE,
              clientId: givenClientId,
            },
          },
        };

        // AND the clientId is set in the database with the target role
        await getDependencyRegistry().accessKey.create({
          keyId: givenClientId,
          role: testCase.givenClientsRole,
          keyType: AccessKeyType.M2M_CLIENT_ID,
        });

        // WHEN the user tries to access the specified resource.
        // THEN the rule should appy
        await assertAccessRule(testCase, event);
      }
    );
  });

  describe("API Key tests", () => {
    test.each(testCases)(
      "should accessResource=$canAccessResource when the users role is $givenClientsRole and the resource is $resourceMethod",
      async (testCase) => {
        // GIVEN an event from a client with the specified role
        // AND a client I'd
        const giveAPIKeyId = getRandomString(20);
        const event = {
          requestContext: {
            identity: {
              apiKeyId: giveAPIKeyId,
            },
          },
        };

        // AND the clientId is set in the database with the target role

        await getDependencyRegistry().accessKey.create({
          keyId: giveAPIKeyId,
          role: testCase.givenClientsRole,
          keyType: AccessKeyType.API_KEY,
        });

        // WHEN the user tries to access the specified resource.
        // THEN the rule should appy
        await assertAccessRule(testCase, event);
      }
    );
  });
});
