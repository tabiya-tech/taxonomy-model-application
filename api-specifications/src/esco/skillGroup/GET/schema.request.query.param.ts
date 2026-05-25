import { SchemaObject } from "ajv";
import { _baseQueryParameterSchema } from "../_shared/schemas.base";
import SkillGroupEnums from "../_shared/enums";

const childrenIdsPattern = "^[0-9a-f]{24}(;[0-9a-f]{24})*$";

const SchemaGETRequestQueryParam: SchemaObject = {
  $id: "/components/schemas/SkillGroupRequestQueryParamSchemaGET",
  type: "object",
  additionalProperties: false,
  properties: {
    ...JSON.parse(JSON.stringify(_baseQueryParameterSchema)),
    childrenIds: {
      description: "Semicolon-separated IDs of children used to filter parent skill groups.",
      type: "string",
      pattern: childrenIdsPattern,
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
