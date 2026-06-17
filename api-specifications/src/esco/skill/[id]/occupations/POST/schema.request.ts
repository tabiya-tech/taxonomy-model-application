import { SchemaObject } from "ajv";
import { SignallingValueLabel } from "../../../../common/objectTypes";
import SkillEnums from "../../../_shared/enums";
import SkillConstants from "../../../_shared/constants";
import { RegExp_Str_ID } from "../../../../../regex";

const SchemaPOSTRequest: SchemaObject = {
  $id: "/components/schemas/SkillOccupationsRequestSchemaPOST",
  type: "object",
  additionalProperties: false,
  properties: {
    requiringOccupationId: { type: "string", pattern: RegExp_Str_ID },
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
      minimum: SkillConstants.SIGNALLING_VALUE_MIN,
      maximum: SkillConstants.SIGNALLING_VALUE_MAX,
    },
  },
  required: ["requiringOccupationId"],
};

export default SchemaPOSTRequest;
