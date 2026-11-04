import DELETEOccupationGroupParentEnums from "./enums";
import SchemaDELETEDetailRequestParam from "./schema.request.param";
import DELETEOccupationGroupParentTypes from "./types";

namespace Detail.parent.DELETEOperation {
  export namespace Schemas {
    export namespace Request {
      export namespace Param {
        export const Payload = SchemaDELETEDetailRequestParam;
      }
    }
  }
  export import Types = DELETEOccupationGroupParentTypes;
  export import Enums = DELETEOccupationGroupParentEnums;
}

export default Detail.parent.DELETEOperation;
