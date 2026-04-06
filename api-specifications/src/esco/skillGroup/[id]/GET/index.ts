import SchemaGETResponseDetail from "./schema.response";
import SkillGroupGETDetailResponse from "./types";
import GETSkillGroupDetailEnums from "./enums";

namespace SkillGroupGETDetailSchemas {
  export namespace Response {
    export const Payload = SchemaGETResponseDetail;
  }
}

namespace SkillGroupGETDetailAPISpecs {
  export import Schemas = SkillGroupGETDetailSchemas;
  export import Types = SkillGroupGETDetailResponse;
  export import Enums = GETSkillGroupDetailEnums;
}
export default SkillGroupGETDetailAPISpecs;
