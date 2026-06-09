import { SchemaObject } from "ajv";
import OccupationEnums from "../../../_shared/enums";
import { SignallingValueLabel } from "../../../../common/objectTypes";
import { RegExp_Str_ID } from "../../../../../regex";

const SchemaPOSTRequest: SchemaObject = {
  $id: "/components/schemas/OccupationSkillsRequestSchemaPOST",
  type: "object",
  additionalProperties: false,
  properties: {
    requiredSkillId: { type: "string", pattern: RegExp_Str_ID },
    relationType: {
      type: "string",
      enum: Object.values(OccupationEnums.OccupationToSkillRelationType),
    },
    signallingValueLabel: {
      type: "string",
      enum: Object.values(SignallingValueLabel),
    },
    signallingValue: {
      type: ["number", "null"],
      minimum: 0,
    },
  },
  required: ["requiredSkillId"],
};

export default SchemaPOSTRequest;
