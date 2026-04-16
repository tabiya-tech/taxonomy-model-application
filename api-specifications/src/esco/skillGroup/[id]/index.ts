import SkillGroupGETDetailAPISpecs from "./GET";
import SkillGroupGETParentsAPISpecs from "./parents";
import SkillGroupGETChildrenAPISpecs from "./children";

import SchemaGETRequestDetailParam from "./schema.request.param";

import SkillGroupDetailURLParameter from "./types";

namespace SkillGroupDetailParamSchemas {
  export namespace Request {
    export namespace Param {
      export const Payload = SchemaGETRequestDetailParam;
    }
  }
}

namespace SkillGroupDetailAPISpecs {
  export import Schemas = SkillGroupDetailParamSchemas;
  export import Types = SkillGroupDetailURLParameter;

  export import GET = SkillGroupGETDetailAPISpecs;
  export import Parent = SkillGroupGETParentsAPISpecs;
  export import Children = SkillGroupGETChildrenAPISpecs;
}
export default SkillGroupDetailAPISpecs;
