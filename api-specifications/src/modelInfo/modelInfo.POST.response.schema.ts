import {SchemaObject} from "ajv";
import {_baseRequestSchemaPOSTProperties} from "./modelInfo.POST.request.schema";
import {RegExp_Str_NotEmptyString, RegExp_Str_UUIDv4, RegExp_Str_UUIDv4_Or_Empty} from "../regex";
import {ModelInfoConstants} from "./modelInfo.constants";


const ModelInfoPOSTResponseSchema: SchemaObject = {
  $id: "/components/schemas/ModelInfoResponseSchema",

  type: "object",
  additionalProperties: false,
  properties: {
    id: {
      description: "The id of the model. It can be used to retrieve the model from the server.",
      type: "string",
      pattern: RegExp_Str_NotEmptyString,
    },
    UUID: {
      description: "The UUID of the model. It can be used to identify the model across systems.",
      type: "string",
      pattern: RegExp_Str_UUIDv4
    },
    originUUID: {
      description: "The UUID of the model this model originated from.",
      type: "string",
      pattern: RegExp_Str_UUIDv4_Or_Empty
    },
    previousUUID: {
      description: "The UUID of the previous version this model.",
      type: "string",
      pattern: RegExp_Str_UUIDv4_Or_Empty
    },
    path: {
      description: "The path to the model resource using the resource id",
      type: "string",
      pattern: RegExp_Str_NotEmptyString,
    },
    tabiyaPath: {
      description: "The path to the model resource using the resource UUID",
      type: "string",
      pattern: RegExp_Str_NotEmptyString,
    },
    released: {
      description: "Whether the model is released or not",
      type: "boolean"
    },
    releaseNotes: {
      description: "The release notes of the model",
      type: "string",
      maxLength: ModelInfoConstants.RELEASE_NOTES_MAX_LENGTH
    },
    version: {
      description: "The version of the model. It should follow the conventions of semantic versioning.",
      type: "string",
      maxLength: ModelInfoConstants.VERSION_MAX_LENGTH
    },
    createdAt: {type: "string", format: "date-time"},
    updatedAt: {type: "string", format: "date-time"},
    ...JSON.parse(JSON.stringify(_baseRequestSchemaPOSTProperties)), // deep copy the base properties
  },

  required: [
    "name",
    "description",
    "locale",
    "id",
    "UUID",
    "path",
    "tabiyaPath",
    "released",
    "releaseNotes",
    "version",
    "createdAt",
    "updatedAt"
  ]
};

export default ModelInfoPOSTResponseSchema;