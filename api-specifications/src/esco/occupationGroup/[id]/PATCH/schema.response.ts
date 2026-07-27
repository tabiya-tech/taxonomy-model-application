import { SchemaObject } from "ajv";
import { _baseResponseSchema } from "../../_shared/schemas.base";

const SchemaPATCHResponse: SchemaObject = {
  ...JSON.parse(JSON.stringify(_baseResponseSchema)),
  $id: "/components/schemas/OccupationGroupResponseSchemaPATCH",
};

export default SchemaPATCHResponse;
