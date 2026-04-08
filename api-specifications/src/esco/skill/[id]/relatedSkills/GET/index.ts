import SkillTypes from "../../../_shared/types";
import SchemaGETRelatedSkillsResponse from "./schema.response";
import SchemaGETRelatedSkillsRequestQuery from "./schema.request.query.param";

namespace Detail.relatedSkills.GETOperation {
  export namespace Schemas {
    export namespace Response {
      export const Payload = SchemaGETRelatedSkillsResponse;
    }
    export namespace Request {
      export namespace Query {
        export const Payload = SchemaGETRelatedSkillsRequestQuery;
      }
    }
  }

  export namespace Types {
    export namespace Response {
      export type Payload = SkillTypes.Detail.RelatedSkills.GET.Response.Payload;
    }
    export namespace Request {
      export namespace Query {
        export type Payload = SkillTypes.Detail.RelatedSkills.GET.Request.Query.Payload;
      }
    }
  }
}

export default Detail.relatedSkills.GETOperation;
