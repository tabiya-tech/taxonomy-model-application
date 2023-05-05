import {AsyncSchema} from "ajv";

export const  localeSchema: AsyncSchema = {
  $async: true,
  $id: "#/components/schemas/localeSchema",
  type: "object",
    properties: {
    UUID: {
      type: "string"
    },
    shortCode: {
      type: "string"
    },
    name: {
      type: "string"
    }
  },
  required: [
    "UUID",
    "shortCode",
    "name"
  ]
}