import Constants from "../constants";
import CognitoEnums from "./enums";

export const _HumanInTheLoopSchema = {
  $id: "/components/schemas/AuthCognitoHumanInTheLoopRequestContext",
  type: "object",
  properties: {
    authType: {
      description: "The type of authentication which is Human in the loop in this case",
      const: CognitoEnums.TokenType.HUMAN_IN_THE_LOOP,
    },
    groups: {
      type: "string",
      description: "The coman separated list of the AWS Cognito groups the user belongs to",
      maxLength: Constants.GROUPS_MAX_LENGTH,
    },
  },
  required: ["authType"],
};

export const _Machine2MachineSchema = {
  $id: "/components/schemas/AuthCognitoMachine2MachineRequestContext",
  type: "object",
  properties: {
    authType: {
      description: "The type of authentication which is Machine to machine in this case",
      const: CognitoEnums.TokenType.MACHINE_TO_MACHINE,
    },
    clientId: {
      type: "string",
      description: "The client id of the machine to machine application",
      maxLength: Constants.CLIENT_ID_MAX_LENGTH,
    },
  },
  required: ["authType", "clientId"],
};

export const SchemaAuthCognitoRequestContext = {
  $id: "/components/schemas/AuthCognitoRequestContextSchema",
  type: "object",
  oneOf: [_HumanInTheLoopSchema, _Machine2MachineSchema],
};

export default SchemaAuthCognitoRequestContext;
