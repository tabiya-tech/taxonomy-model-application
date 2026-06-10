import { SchemaObject } from "ajv";
import OccupationEnums from "../../../_shared/enums";
import OccupationConstants from "../../../_shared/constants";
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
      minimum: OccupationConstants.SIGNALLING_VALUE_MIN,
      maximum: OccupationConstants.SIGNALLING_VALUE_MAX,
    },
  },
  required: ["requiredSkillId"],
};

export default SchemaPOSTRequest;
