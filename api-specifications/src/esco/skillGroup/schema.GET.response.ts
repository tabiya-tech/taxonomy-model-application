import { SchemaObject } from "ajv";
import { _baseResponseSchema } from "./schemas.base";

const SchemaGETResponse: SchemaObject = {
  $id: "/components/schemas/SkillGroupResponseSchemaGET",
  type: "object",
  properties: {
    data: {
      type: "array",
      items: {
        ...JSON.parse(JSON.stringify(_baseResponseSchema)),
      },
    },
    limit: {
      type: "integer",
      minimum: 1,
      description: "The maximum number of skill groups that could be returned in the response.",
    },
    nextCursor: {
      type: ["string", "null"],
      description:
        "A base64 string representing the cursor for the next page of results. Null if there is no next page.",
    },
  },
  required: ["data", "limit"],
  additionalProperties: false,
};

export default SchemaGETResponse;
