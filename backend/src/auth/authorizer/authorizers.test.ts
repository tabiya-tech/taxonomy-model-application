import AuthAPISpecs from "api-specifications/auth";

import { getRandomString } from "_test_utilities/getMockRandomData";

import { IAccessKeyService } from "auth/accessKey/accessKeyService";
import { AccessKeyType, IAccessKey } from "auth/accessKey/accessKey.types";
import { APIKeyAuthorizer, HumanInTheLoopAuthorizer, MachineToMachineTokenAuthorizer } from "./authorizers";

class MockedAccessKeyService implements IAccessKeyService {
  constructor(private readonly accessKey: IAccessKey | null = null) {}

  findByKeyId(_keyType: AccessKeyType, _keyId: string): Promise<IAccessKey | null> {
    return Promise.resolve(this.accessKey);
  }

  create(accessKey: IAccessKey): Promise<IAccessKey> {
    return Promise.resolve(accessKey);
  }
}

const TabiyaRoles = AuthAPISpecs.Enums.TabiyaRoles;

describe("Authorizers", () => {
  describe("APIKeyAuthorizer", () => {
    test.each([
      // When the required role is ANONYMOUS, then all the API keys should pass
      [TabiyaRoles.REGISTERED_USER, TabiyaRoles.ANONYMOUS, true],
      [TabiyaRoles.MODEL_MANAGER, TabiyaRoles.ANONYMOUS, true],

      // When a required role is equal to the api key role, then it should pass
      [TabiyaRoles.REGISTERED_USER, TabiyaRoles.REGISTERED_USER, true],
      [TabiyaRoles.MODEL_MANAGER, TabiyaRoles.MODEL_MANAGER, true],

      // a model manager is the parent of a registered user.
      [TabiyaRoles.MODEL_MANAGER, TabiyaRoles.REGISTERED_USER, true],

      // A registered user can't perform model manager roles.
      [TabiyaRoles.REGISTERED_USER, TabiyaRoles.MODEL_MANAGER, false],
    ])(
      "should return the correct check for given apiKey role and required role",
      async (givenAccessKeyRole, givenRequiredRole, expectedResult) => {
        // GIVEN an api access role, required role.
        // AND an api key doc
        const givenKeyId = getRandomString(20);
        const givenAPIKeyDoc: IAccessKey = {
          keyType: AccessKeyType.M2M_CLIENT_ID,
          keyId: givenKeyId,
          role: givenAccessKeyRole,
        };

        // AND the machine-to-machine authorizer instance is constructed.
        const accessKeyService = new MockedAccessKeyService(givenAPIKeyDoc);
        const machineToMachineAuthorizer = new APIKeyAuthorizer(accessKeyService, givenKeyId);

        // WHEN we check if the user has a required role.
        const actualResult = await machineToMachineAuthorizer.hasRole(givenRequiredRole);

        // THEN it should return the expected result.
        expect(actualResult).toBe(expectedResult);
      }
    );

    test("should fail for an invalid/non-existing api key", async () => {
      // GIVEN a random key id
      const givenKeyId = getRandomString(20);

      // AND the machine-to-machine authorizer instance is constructed to return null
      const accessKeyService = new MockedAccessKeyService(null);
      const machineToMachineAuthorizer = new APIKeyAuthorizer(accessKeyService, givenKeyId);

      // WHEN we check if the user has a required role.
      const actualResult = await machineToMachineAuthorizer.hasRole(TabiyaRoles.MODEL_MANAGER);

      // THEN it should return the expected result.
      expect(actualResult).toBe(false);
    });
  });

  describe("HumanInTheLoopAuthorizer", () => {
    test.each([
      [[], TabiyaRoles.ANONYMOUS, true],
      [[], TabiyaRoles.REGISTERED_USER, true],
      [[], TabiyaRoles.MODEL_MANAGER, false],

      [[TabiyaRoles.MODEL_MANAGER], TabiyaRoles.ANONYMOUS, true],
      [[TabiyaRoles.MODEL_MANAGER], TabiyaRoles.REGISTERED_USER, true],
      [[TabiyaRoles.MODEL_MANAGER], TabiyaRoles.MODEL_MANAGER, true],

      // For now, we don't have a group for registered-users, so we don't have tests for them.
    ])(
      "should return isValid given parameters %s %s %s",
      async (givenUserGroups, givenRequiredRole, expectedResult) => {
        // GIVEN user groups, required role.
        // AND the human in the loop authorizer instance is constructed.
        const authorizer = new HumanInTheLoopAuthorizer(givenUserGroups);

        // WHEN we check if the user has a required role.
        const actualResult = await authorizer.hasRole(givenRequiredRole);

        // THEN it should return the expected result.
        expect(actualResult).toBe(expectedResult);
      }
    );
  });

  describe("MachineToMachineTokenAuthorizer", () => {
    test.each([
      // When the required role is ANONYMOUS, then all the API keys should pass
      [TabiyaRoles.REGISTERED_USER, TabiyaRoles.ANONYMOUS, true],
      [TabiyaRoles.MODEL_MANAGER, TabiyaRoles.ANONYMOUS, true],

      // When a required role is equal to the api key role, then it should pass
      [TabiyaRoles.REGISTERED_USER, TabiyaRoles.REGISTERED_USER, true],
      [TabiyaRoles.MODEL_MANAGER, TabiyaRoles.MODEL_MANAGER, true],

      // a model manager is the parent of a registered user.
      [TabiyaRoles.MODEL_MANAGER, TabiyaRoles.REGISTERED_USER, true],

      // A registered user can't perform model manager roles.
      [TabiyaRoles.REGISTERED_USER, TabiyaRoles.MODEL_MANAGER, false],
    ])(
      "should return the correct check for given apiKey role and required role",
      async (givenAccessKeyRole, givenRequiredRole, expectedResult) => {
        // GIVEN an api access role, required role.
        // AND an api key doc
        const givenKeyId = getRandomString(20);
        const givenAPIKeyDoc: IAccessKey = {
          keyType: AccessKeyType.M2M_CLIENT_ID,
          keyId: givenKeyId,
          role: givenAccessKeyRole,
        };

        // AND the machine-to-machine authorizer instance is constructed.
        const accessKeyService = new MockedAccessKeyService(givenAPIKeyDoc);
        const machineToMachineAuthorizer = new MachineToMachineTokenAuthorizer(accessKeyService, givenKeyId);

        // WHEN we check if the user has a required role.
        const actualResult = await machineToMachineAuthorizer.hasRole(givenRequiredRole);

        // THEN it should return the expected result.
        expect(actualResult).toBe(expectedResult);
      }
    );

    test("should fail for an invalid/non-existing api key", async () => {
      // GIVEN a random key id
      const givenKeyId = getRandomString(20);

      // AND the machine-to-machine authorizer instance is constructed to return null
      const accessKeyService = new MockedAccessKeyService(null);
      const machineToMachineAuthorizer = new MachineToMachineTokenAuthorizer(accessKeyService, givenKeyId);

      // WHEN we check if the user has a required role.
      const actualResult = await machineToMachineAuthorizer.hasRole(TabiyaRoles.MODEL_MANAGER);

      // THEN it should return the expected result.
      expect(actualResult).toBe(false);
    });
  });
});
