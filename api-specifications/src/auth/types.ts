import CognitoTypes from "./cognito/types";

export namespace AuthTypes {
  export namespace Request {
    export import Cognito = CognitoTypes;
  }
}

export default AuthTypes;
