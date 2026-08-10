import SkillGroupGETDetailAPISpecs from "./GET";
import SkillGroupGETParentsAPISpecs from "./parents";
import SkillGroupGETChildrenAPISpecs from "./children";
import SkillGroupHistoryAPISpecs from "./history";
import PUTSkillGroupOperation from "./PUT";
import PATCHSkillGroupOperation from "./PATCH";

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
  export import PUT = PUTSkillGroupOperation;
  export import PATCH = PATCHSkillGroupOperation;

  export import Parent = SkillGroupGETParentsAPISpecs;
  export import Children = SkillGroupGETChildrenAPISpecs;
  export import History = SkillGroupHistoryAPISpecs;
}
export default SkillGroupDetailAPISpecs;
