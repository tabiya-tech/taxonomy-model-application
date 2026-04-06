import SchemaPOSTRequest from "./schema.request";
import SchemaPOSTResponse from "./schema.response";
import SchemaPOSTRequestParam from "./schema.request.param";
import SkillGroupPOSTTypes from "./types";
import SkillGroupPOSTConstants from "./constants";
import SkillGroupPOSTEnums from "./enums";

namespace SkillGroupPOSTSchemas {
  export namespace Request {
    export const Payload = SchemaPOSTRequest;
    export namespace Param {
      export const Payload = SchemaPOSTRequestParam;
    }
  }
  export namespace Response {
    export const Payload = SchemaPOSTResponse;
  }
}
namespace SkillGroupPOSTAPISpecs {
  export import Schemas = SkillGroupPOSTSchemas;
  export import Types = SkillGroupPOSTTypes;
  export import Constants = SkillGroupPOSTConstants;
  export import Enums = SkillGroupPOSTEnums;
}
export default SkillGroupPOSTAPISpecs;
