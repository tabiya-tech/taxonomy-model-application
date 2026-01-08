//mute chatty console
import "_test_utilities/consoleMock";

import { APIGatewayEvent } from "aws-lambda";
import AuthAPISpecs from "api-specifications/auth";
import { generateRandomNumber, getRandomString } from "_test_utilities/getMockRandomData";

import * as Authorizers from "./index";
import { checkRole, RoleRequired } from "./index";

import { STD_ERRORS_RESPONSES } from "server/httpUtils";
import { APIKeyAuthorizer, HumanInTheLoopAuthorizer, MachineToMachineTokenAuthorizer } from "./authorizers";

function createAPIGatewayEvent(requestContext: object): APIGatewayEvent {
  return {
    requestContext,
  } as APIGatewayEvent;
}

function getRandomBoolean() {
  return generateRandomNumber(1, 2) == 1;
}

jest.mock("auth/init", () => {
  return {
    initOnce: jest.fn().mockImplementation(() => Promise.resolve()),
  };
});

describe("checkRole", () => {
  beforeEach(() => {
    (console.error as jest.Mock).mockClear();
    jest.clearAllMocks();
  });

  test("should use api key authorizer if the identity.apiKeyId is provided", async () => {
    // GIVEN an event is for an API key authorized request.
    const givenAPIKeyId = getRandomString(10);
    const event = createAPIGatewayEvent({
      identity: {
        apiKeyId: givenAPIKeyId,
      },
    });

    // AND a mocked APIKeyAuthorizer.hasRole function
    const expectedResult = getRandomBoolean();
    const apiKeyHasRole = jest.spyOn(APIKeyAuthorizer.prototype, "hasRole").mockResolvedValue(expectedResult);

    // AND a required role
    const givenRequiredRole = AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER;

    // WHEN the checkRole function is called.
    const actualResult = await checkRole(event, givenRequiredRole);

    // THEN it should forward the APIKeyAuthorizer.hasRole response
    expect(actualResult).toEqual(expectedResult);

    // AND the APIKeyAuthorizer.hasRole should be called with the given API key ID and required role.
    expect(apiKeyHasRole).toHaveBeenCalledWith(givenRequiredRole);

    // AND no errors should be logged.
    expect(console.error).not.toHaveBeenCalled();
  });

  test("should use return false if an invalid request context object", async () => {
    // GIVEN an event with an invalid request context object.
    const event = createAPIGatewayEvent({
      authorizer: {
        invalidKey: getRandomString(10),
      },
    });

    // AND a required role
    const givenRequiredRole = AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER;

    // WHEN the checkRole function is called.
    const actualResult = await checkRole(event, givenRequiredRole);

    // THEN it should return false
    expect(actualResult).toEqual(false);

    // AND an error should be logged.
    expect(console.error).toHaveBeenCalled();
  });

  test("should use human in the loop authorizer authorizer if the context contains HUMAN_IN_THE_LOOP", async () => {
    // GIVEN an event with a HUMAN_IN_THE_LOOP context object.
    const event = createAPIGatewayEvent({
      authorizer: {
        authType: AuthAPISpecs.Enums.Cognito.TokenType.HUMAN_IN_THE_LOOP,
        groups: "",
      },
    });

    // AND a mocked HumanInTheLoopAuthorizer.hasRole function
    const expectedResult = getRandomBoolean();
    const humanInTheLoopHasRole = jest
      .spyOn(HumanInTheLoopAuthorizer.prototype, "hasRole")
      .mockResolvedValue(expectedResult);

    // AND a required role
    const givenRequiredRole = AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER;

    // WHEN the checkRole function is called.
    const actualResult = await checkRole(event, givenRequiredRole);

    // THEN it should forward the HumanInTheLoopAuthorizer.hasRole response
    expect(actualResult).toEqual(expectedResult);

    // AND the HumanInTheLoopAuthorizer.hasRole should be called with the given API key ID and required role.
    expect(humanInTheLoopHasRole).toHaveBeenCalledWith(givenRequiredRole);

    // AND no errors should be logged.
    expect(console.error).not.toHaveBeenCalled();
  });

  test("should use machine to machine authorizer authorizer if the context contains MACHINE_TO_MACHINE", async () => {
    // GIVEN an event with a MACHINE_TO_MACHINE context object.
    const event = createAPIGatewayEvent({
      authorizer: {
        authType: AuthAPISpecs.Enums.Cognito.TokenType.MACHINE_TO_MACHINE,
        clientId: "given client id",
      },
    });

    // AND a mocked MachineToMachineTokenAuthorizer.hasRole function
    const expectedResult = getRandomBoolean();
    const machineToMachineHasRole = jest
      .spyOn(MachineToMachineTokenAuthorizer.prototype, "hasRole")
      .mockResolvedValue(expectedResult);

    // AND a required role
    const givenRequiredRole = AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER;

    // WHEN the checkRole function is called.
    const actualResult = await checkRole(event, givenRequiredRole);

    // THEN it should forward the MachineToMachineTokenAuthorizer.hasRole response
    expect(actualResult).toEqual(expectedResult);

    // AND the MachineToMachineTokenAuthorizer.hasRole should be called with the given API key ID and required role.
    expect(machineToMachineHasRole).toHaveBeenCalledWith(givenRequiredRole);

    // AND no errors should be logged.
    expect(console.error).not.toHaveBeenCalled();
  });

  test("should return false if accessKeyService is null", async () => {
    // GIVEN an event with a MACHINE_TO_MACHINE context object.
    const event = createAPIGatewayEvent({
      authorizer: {
        authType: AuthAPISpecs.Enums.Cognito.TokenType.MACHINE_TO_MACHINE,
        clientId: "given client id",
      },
    });

    // AND there is no accessKeyService.
    // @ts-ignore
    jest
      .spyOn(MachineToMachineTokenAuthorizer.prototype, "hasRole")
      .mockRejectedValue(new Error("accessKeyService is null"));

    // WHEN the checkRole function is called.
    const actualResult = await checkRole(event, AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER);

    // THEN it should return false
    expect(actualResult).toEqual(false);

    // AND an error should be logged.
    expect(console.error).toHaveBeenCalledWith("Error checking role", expect.any(Error), { event });
  });
});

describe("RoleRequired", () => {
  beforeEach(() => {
    (console.error as jest.Mock).mockClear();
    jest.clearAllMocks();
  });

  test("should throw an error if the target is not a method", () => {
    // GIVEN a non-method target.
    // WHEN RoleRequired is applied
    // THEN it should throw an error.
    const givenRequiredRole = AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER;
    expect(() => RoleRequired(givenRequiredRole)(null, "notMethod", { value: null })).toThrow();
  });

  test("should forward the response if the checkRole function returns true", async () => {
    // GIVEN Check role will return true. (i.e.: Can access the resource)
    jest.spyOn(Authorizers, "checkRole").mockResolvedValue(true);

    // AND RoleRequired is used on a function which will return a value.
    // WHEN the function is called.
    const expectedResource = getRandomString(10);
    const givenRequiredRole = AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER;
    const actualResult = await RoleRequired(givenRequiredRole)(null, "method", {
      value: () => expectedResource,
    }).value();

    // THEN the method result should be forwarded as is.
    expect(actualResult).toBe(expectedResource);
  });

  test("should return FORBIDDEN if the checkRole function returns false", async () => {
    // GIVEN Check role will return false. (i.e.: Cannot access the resource)
    jest.spyOn(Authorizers, "checkRole").mockResolvedValue(false);

    // AND RoleRequired is added on a function.
    // WHEN the function is called.
    const expectedResource = getRandomString(10);
    const givenRequiredRole = AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER;
    const actualResult = await RoleRequired(givenRequiredRole)(null, "method", {
      value: () => expectedResource,
    }).value();

    // THEN the method should return a 403 FORBIDDEN response.
    expect(actualResult).toEqual(STD_ERRORS_RESPONSES.FORBIDDEN);
  });
});
