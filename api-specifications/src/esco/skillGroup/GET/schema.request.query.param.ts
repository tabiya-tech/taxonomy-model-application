import { SchemaObject } from "ajv";
import { _baseQueryParameterSchema } from "../_shared/schemas.base";
import SkillGroupEnums from "../_shared/enums";
import SkillGroupRegexes from "../_shared/regex";

const SchemaGETRequestQueryParam: SchemaObject = {
  $id: "/components/schemas/SkillGroupRequestQueryParamSchemaGET",
  type: "object",
  additionalProperties: false,
  properties: {
    ...JSON.parse(JSON.stringify(_baseQueryParameterSchema)),
    root: {
      description: "Filter only root skill groups (skill groups with no parent).",
      type: "boolean",
    },
    childrenIds: {
      description: "Semicolon-separated IDs of children used to filter parent skill groups.",
      type: "string",
      pattern: SkillGroupRegexes.Str.CHILDREN_IDS,
    },
    childrenType: {
      description: "Type of the children referenced in childrenIds.",
      type: "string",
      enum: Object.values(SkillGroupEnums.Relations.Children.ObjectTypes),
    },
  },
  allOf: [
    {
      if: {
        properties: {
          childrenIds: {},
        },
        required: ["childrenIds"],
      },
      then: {
        properties: {
          childrenType: {},
        },
        required: ["childrenType"],
      },
    },
    {
      if: {
        properties: {
          childrenType: {},
        },
        required: ["childrenType"],
      },
      then: {
        properties: {
          childrenIds: {},
        },
        required: ["childrenIds"],
      },
    },
  ],
};
export default SchemaGETRequestQueryParam;
