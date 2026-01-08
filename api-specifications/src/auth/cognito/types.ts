import Enums from "./enums";

namespace CognitoTypes {
  // This is here to make sure the namespace is not empty and the:
  //    "Cannot use 'export import' on a type or type-only namespace when the '--isolatedModules' flag is provided"
  // error is not thrown.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = 0;
  // ---

  export type Context =
    | {
        authType: Enums.TokenType.HUMAN_IN_THE_LOOP;

        // AWS->API Gateway to forward your request context it needs to be a string, so we cannot use an array of roles.
        // https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-lambda-authorizer-output.html
        groups: string;
      }
    | {
        authType: Enums.TokenType.MACHINE_TO_MACHINE;
        clientId: string;
      };
}

export default CognitoTypes;
