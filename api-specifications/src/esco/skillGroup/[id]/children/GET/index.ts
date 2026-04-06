import SkillGroupChildrenGETTypes from "./types";
import GETSkillGroupChildrenEnums from "./enums";
import SkillGroupChildrenGETConstants from "./constants";
import SchemaGETResponseChild from "./schema.child.response";
import SchemaGETChildrenResponse from "./schema.children.response";
import SchemaGETChildrenRequestQuery from "./schema.children.request.query.param";

namespace SkillGroupChildrenSchemas {
  export namespace Response {
    export namespace Child {
      export const Payload = SchemaGETResponseChild;
    }
    export namespace Children {
      export const Payload = SchemaGETChildrenResponse;
    }
  }
  export namespace Request {
    export namespace Query {
      export const Payload = SchemaGETChildrenRequestQuery;
    }
  }
}

namespace SkillGroupChildrenAPISpecs {
  export import Constants = SkillGroupChildrenGETConstants;
  export import Enums = GETSkillGroupChildrenEnums;
  export import Types = SkillGroupChildrenGETTypes;
  export import Schemas = SkillGroupChildrenSchemas;
}
export default SkillGroupChildrenAPISpecs;
