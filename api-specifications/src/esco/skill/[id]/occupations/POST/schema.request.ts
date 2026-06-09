import { SchemaObject } from "ajv";
import { SignallingValueLabel } from "../../../../common/objectTypes";
import SkillEnums from "../../../_shared/enums";

const SchemaPOSTRequest: SchemaObject = {
  $id: "/components/schemas/SkillOccupationsRequestSchemaPOST",
  type: "object",
  additionalProperties: false,
  properties: {
    requiringOccupationId: { type: "string", minLength: 24, maxLength: 24 },
    relationType: {
      type: "string",
      enum: Object.values(SkillEnums.OccupationToSkillRelationType),
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
  required: ["requiringOccupationId", "relationType", "signallingValueLabel"],
};

export default SchemaPOSTRequest;
