import POSTOccupationSkillsErrors from "./enums";
import SchemaPOSTRequest from "./schema.request";
import POSTOccupationSkillsTypes from "./types";
import OccupationTypes from "../../../_shared/types";
import SchemaGETSkillsResponse from "../GET/schema.response";

namespace Detail.skills.POSTOperation {
  export namespace Schemas {
    export namespace Request {
      export const Payload = SchemaPOSTRequest;
    }
    export namespace Response {
      export const Payload = (SchemaGETSkillsResponse.properties as any).data.items;
    }
  }
  export namespace Types {
    export namespace Request {
      export type Payload = POSTOccupationSkillsTypes.Request.Payload;
    }
    export namespace Response {
      export type Payload = OccupationTypes.Detail.skills.GET.Response.SkillItem;
    }
  }
  export import Errors = POSTOccupationSkillsErrors;
}

export default Detail.skills.POSTOperation;
