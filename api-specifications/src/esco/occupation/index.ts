import OccupationConstants from "./constants";
import OccupationEnums from "./enums";
import OccupationTypes from "./types";

import SchemaGETResponse from "./schema.GET.response";
import SchemaGETRequestParam from "./schema.GET.request.param";
import SchemaGETDetailRequestParam from "./schema.GET.request.ById.param";
import SchemaGETRequestQueryParam from "./schema.GET.request.query.param";
import SchemaPOSTRequest from "./schema.POST.request";
import SchemaPOSTResponse from "./schema.POST.response";
import OccupationRegexes from "./regex";

namespace OccupationSchemas {
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
      export const Payload = SchemaPOSTRequest;
    }
  }
}

namespace OccupationAPISpecs {
  export import Constants = OccupationConstants;
  export import Enums = OccupationEnums;
  export import Types = OccupationTypes;
  export import Schemas = OccupationSchemas;
  export import Patterns = OccupationRegexes;
}

export default OccupationAPISpecs;
