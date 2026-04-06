import SkillGroupGETParentTypes from "./types";
import GETSkillGroupParentEnums from "./enums";
import SchemaGETSkillGroupParentResponse from "./schema.parent.response";
import SchemaGETSkillGroupParentsResponse from "./schema.parents.response";
import SchemaGETSkillGroupParentRequestQueryParam from "./schema.parents.request.query.param";
import SkillGroupParentGETConstants from "./constants";

namespace SkillGroupParentsSchemas {
  export namespace Request {
    export namespace Query {
      export const Payload = SchemaGETSkillGroupParentRequestQueryParam;
    }
  }
  export namespace Response {
    export const Payload = SchemaGETSkillGroupParentResponse;
    export namespace Parents {
      export const Payload = SchemaGETSkillGroupParentsResponse;
    }
  }
}

namespace SkillGroupParentsAPISpecs {
  export import Schemas = SkillGroupParentsSchemas;

  export import Types = SkillGroupGETParentTypes;
  export import Enums = GETSkillGroupParentEnums;
  export import Constants = SkillGroupParentGETConstants;
}

export default SkillGroupParentsAPISpecs;
