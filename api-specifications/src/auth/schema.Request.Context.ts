import { SchemaObject } from "ajv";
import AuthConstants from "./constants";
import { RegExp_Str_NotEmptyString } from "../regex";

const SchemaRequestContext: SchemaObject = {
  $id: "/components/schemas/AuthResponseContextSchema",
  type: "object",
  additionalProperties: false,
  properties: {
    username: {
      type: "string",
      description: "The username of the user.",
      maxLength: AuthConstants.USERNAME_MAX_LENGTH,
      pattern: RegExp_Str_NotEmptyString,
    },
    roles: {
      type: "string",
      description: "A comma-separated list of roles.",
      maxLength: AuthConstants.ROLES_MAX_LENGTH,
    },
  },
  required: ["username"],
};

export default SchemaRequestContext;
