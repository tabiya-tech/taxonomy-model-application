import SchemaGETResponse from "./schema.response";
import SchemaGETRequestParam from "./schema.request.param";
import SkillGroupGETTypes from "./types";
import SkillGroupGETConstants from "./constants";
import SkillGroupGETEnums from "./enums";
import SchemaGETRequestQueryParams from "./schema.request.query.param";

namespace SkillGroupGETSchemas {
  export namespace Request {
    export namespace Param {
      export const Payload = SchemaGETRequestParam;
    }
    export namespace Query {
      export const Payload = SchemaGETRequestQueryParams;
    }
  }
  export namespace Response {
    export const Payload = SchemaGETResponse;
  }
}
namespace SkillGroupGETAPISpecs {
  export import Schemas = SkillGroupGETSchemas;
  export import Types = SkillGroupGETTypes;
  export import Constants = SkillGroupGETConstants;
  export import Enums = SkillGroupGETEnums;
}
export default SkillGroupGETAPISpecs;
