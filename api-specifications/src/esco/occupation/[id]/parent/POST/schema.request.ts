import { SchemaObject } from "ajv";
import OccupationEnums from "../../../_shared/enums";

const SchemaPOSTRequest: SchemaObject = {
  $id: "/components/schemas/OccupationParentRequestSchemaPOST",
  type: "object",
  additionalProperties: false,
  properties: {
    parentId: { type: "string", minLength: 24, maxLength: 24 },
    parentType: {
      type: "string",
      enum: Object.values(OccupationEnums.Relations.Parent.ObjectTypes),
    },
  },
  required: ["parentId", "parentType"],
};

export default SchemaPOSTRequest;
