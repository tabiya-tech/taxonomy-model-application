import { SchemaObject } from "ajv";
import InfoConstants from "../info/constants";

const SchemaGETResponse: SchemaObject = {
  $id: "/components/schemas/InfoResponseSchemaGET",
  type: "object",
  additionalProperties: false,
  properties: {
    date: {
      type: "string",
      format: "date-time",
      description: "The date and time when the application was built.",
    },
    version: {
      type: "string",
      description: "The name of the git tag/branch the application was built from.",
      maxLength: InfoConstants.VERSION_MAX_LENGTH,
    },
    buildNumber: {
      type: "string",
      description: "The build number of the application.",
      maxLength: InfoConstants.BUILD_NUMBER_MAX_LENGTH,
    },
    sha: {
      type: "string",
      description: "The git SHA of the commit used to build the application.",
      maxLength: InfoConstants.SHA_MAX_LENGTH,
    },
    path: {
      type: "string",
      description: "The URL path of the endpoint.",
      format: "uri",
      pattern: "^https://.*", // accept only https
      maxLength: InfoConstants.MAX_URI_LENGTH,
    },
    database: {
      type: "string",
      enum: ["connected", "not connected"],
      description: "The database connection status.",
    },
  },
  required: ["date", "version", "buildNumber", "sha", "path", "database"],
};

export default SchemaGETResponse;
