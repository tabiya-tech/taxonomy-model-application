import POSTSkillGroupParentEnums from "./enums";
import SchemaPOSTRequest from "./schema.request";
import POSTSkillGroupParentTypes from "./types";
import SchemaPOSTResponse from "./schema.response";
import POSTSkillGroupParentConstants from "./constants";

namespace Detail.parents.POSTOperation {
  export namespace Schemas {
    export namespace Request {
      export const Payload = SchemaPOSTRequest;
    }
    export namespace Response {
      export const Payload = SchemaPOSTResponse;
    }
  }
  export import Types = POSTSkillGroupParentTypes;
  export import Enums = POSTSkillGroupParentEnums;
  export import Constants = POSTSkillGroupParentConstants;
}
export default Detail.parents.POSTOperation;
