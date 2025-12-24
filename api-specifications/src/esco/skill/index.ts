import SkillConstants from "./constants";
import SkillEnums from "./enums";
import SkillTypes from "./types";

import SchemaGETResponse from "./schema.GET.response";
import SchemaGETRequestParam from "./schema.GET.request.param";
import SchemaGETDetailRequestParam from "./schema.GET.request.ById.param";
import SchemaGETRequestQueryParam from "./schema.GET.request.query.param";
import SchemaPOSTRequest from "./schema.POST.request";
import SchemaPOSTResponse from "./schema.POST.response";
import SchemaGETResponseById from "./schema.GET.response.ById";
import SchemaPOSTRequestParam from "./schema.POST.request.param";

namespace SkillSchemas {
  export namespace GET {
    export namespace Response {
      export const Payload = SchemaGETResponse;
      export namespace ById {
        export const Payload = SchemaGETResponseById;
      }
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
          export const Payload = SchemaGETDetailRequestParam;
        }
      }
    }
  }

  export namespace POST {
    export namespace Response {
      export const Payload = SchemaPOSTResponse;
    }

    export namespace Request {
      export namespace Param {
        export const Payload = SchemaPOSTRequestParam;
      }
      export const Payload = SchemaPOSTRequest;
    }
  }
}

namespace SkillAPISpecs {
  export import Constants = SkillConstants;
  export import Enums = SkillEnums;
  export import Types = SkillTypes;
  export import Schemas = SkillSchemas;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = 0; // To avoid empty namespace error
}

export default SkillAPISpecs;
