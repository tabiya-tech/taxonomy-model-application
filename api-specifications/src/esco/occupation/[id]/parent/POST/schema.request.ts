import { SchemaObject } from "ajv";
import OccupationEnums from "../../../_shared/enums";
import { RegExp_Str_ID } from "../../../../../regex";

const SchemaPOSTRequest: SchemaObject = {
  $id: "/components/schemas/OccupationParentRequestSchemaPOST",
  type: "object",
  additionalProperties: false,
  properties: {
    id: { type: "string", pattern: RegExp_Str_ID },
    objectType: {
      type: "string",
      enum: Object.values(OccupationEnums.Relations.Parent.ObjectTypes),
    },
  },
  required: ["id", "objectType"],
};

export default SchemaPOSTRequest;
