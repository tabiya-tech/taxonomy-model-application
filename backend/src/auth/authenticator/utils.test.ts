import { generatePolicy } from "./utils";
import { APIGatewayAuthorizerResult } from "aws-lambda";

describe("Utils", () => {
  test.each([
    [
      "given-principal-id-3",
      "Deny",
      "given-resource",
      {
        username: "given-user-name",
      },
    ],
    ["given-principal-id-1", "Allow", "given-resource", {}],
    ["given-principal-id-2", "Deny", "given-resource", undefined],
  ] as const)(
    "should return expected APIGatewayAuthorizerResult %s",
    (givenPrincipalId, givenEffect, givenResource, givenContext) => {
      // GIVEN the principal id
      // AND the effect
      // AND the resource
      // AND given the optional context
      // WHEN the APIGatewayAuthorizerResult is generated
      const actualResult: APIGatewayAuthorizerResult = generatePolicy(
        givenPrincipalId,
        givenEffect,
        givenResource,
        givenContext
      );

      // THEN the result should match the expected output
      expect(actualResult.principalId).toBe(givenPrincipalId);
      expect(actualResult.policyDocument?.Statement[0].Effect).toBe(givenEffect);
      expect(actualResult.context).toBe(givenContext);

      // AND it should match the snapshot
      expect(actualResult).toMatchSnapshot();
    }
  );
});
