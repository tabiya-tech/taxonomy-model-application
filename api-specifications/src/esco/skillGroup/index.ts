import SkillGroupConstants from "./constants";
import SkillGroupEnums from "./enums";
import SkillGroupRegexes from "./regex";
import SkillGroupTypes from "./types";

import SchemaGETResponse from "./schema.GET.response";
import SchemaPOSTRequest from "./schema.POST.request";
import SchemaPOSTResponse from "./schema.POST.response";
import SchemaGETRequestParam from "./schema.GET.request.param";
import SchemaGETByIdRequestParam from "./schema.GET.request.ById.param";
import SchemaGETRequestQueryParam from "./schema.GET.request.query.param";

namespace SkillGroupSchemas {
  export namespace GET {
    export namespace Response {
      export const Payload = SchemaGETResponse;
    }
    export namespace Request {
      export namespace Param {
        export const Payload = SchemaGETRequestParam;
      }
      export namespace Query {
        export const Payload = SchemaGETRequestQueryParam;
      }
      export namespace ById {
        export namespace Param {
          export const Payload = SchemaGETByIdRequestParam;
        }
      }
    }
  }
  export namespace POST {
    export namespace Response {
      export const Payload = SchemaPOSTResponse;
    }
    export namespace Request {
      export const Payload = SchemaPOSTRequest;
    }
  }
}

namespace SkillGroupAPISpecs {
  export import Enums = SkillGroupEnums;
  export import Types = SkillGroupTypes;
  export import Constants = SkillGroupConstants;
  export import Schemas = SkillGroupSchemas;
  export import Patterns = SkillGroupRegexes;
}

export default SkillGroupAPISpecs;
