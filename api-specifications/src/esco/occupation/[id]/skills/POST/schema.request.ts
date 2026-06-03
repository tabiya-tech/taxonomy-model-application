import { SchemaObject } from "ajv";
import OccupationEnums from "../../../_shared/enums";
import { SignallingValueLabel } from "../../../../common/objectTypes";

const SchemaPOSTRequest: SchemaObject = {
  $id: "/components/schemas/OccupationSkillsRequestSchemaPOST",
  type: "object",
  additionalProperties: false,
  properties: {
    requiredSkillId: { type: "string", minLength: 24, maxLength: 24 },
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
      maximum: 1,
    },
  },
  required: ["requiredSkillId", "relationType", "signallingValueLabel"],
};

export default SchemaPOSTRequest;
