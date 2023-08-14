import {SchemaObject} from "ajv";
import {_baseRequestSchemaProperties, IModelInfoRequest} from "./modelInfoRequest";
import {RegExp_Str_NotEmptyString, RegExp_Str_UUIDv4, RegExp_Str_UUIDv4_Or_Empty} from "../regex";
import {RELEASE_NOTES_MAX_LENGTH, VERSION_MAX_LENGTH} from "./modelInfo.constants";

export interface IModelInfoResponse extends IModelInfoRequest {
  id: string,
  UUID: string,
  originUUID: string,
  previousUUID: string,
  path: string,
  tabiyaPath: string,
  released: boolean,
  releaseNotes: string,
  version: string,
  createdAt: string,
  updatedAt: string
}

export enum ModelInfoResponseErrorCodes {
  DB_FAILED_TO_CREATE_MODEL = "DB_FAILED_TO_CREATE_MODEL",
  MODEL_COULD_NOT_VALIDATE = "MODEL_COULD_NOT_VALIDATE",
}

export const ModelInfoResponseSchema: SchemaObject = {
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
      maxLength: RELEASE_NOTES_MAX_LENGTH
    },
    version: {
      description: "The version of the model. It should follow the conventions of semantic versioning.",
      type: "string",
      maxLength: VERSION_MAX_LENGTH
    },
    createdAt: {type: "string", format: "date-time"},
    updatedAt: {type: "string", format: "date-time"},
    ...JSON.parse(JSON.stringify(_baseRequestSchemaProperties)), // deep copy the base properties
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