import { SchemaObject } from "ajv";
import OccupationGroupEnums from "../../../_shared/enums";
import { RegExp_Str_ID } from "../../../../../regex";

const SchemaPUTRequest: SchemaObject = {
  $id: "/components/schemas/OccupationGroupParentRequestSchemaPUT",
  type: "object",
  additionalProperties: false,
  properties: {
    id: { type: "string", pattern: RegExp_Str_ID },
    objectType: {
      type: "string",
      enum: Object.values(OccupationGroupEnums.Relations.Parent.ObjectTypes),
    },
  },
  required: ["id", "objectType"],
};

export default SchemaPUTRequest;
