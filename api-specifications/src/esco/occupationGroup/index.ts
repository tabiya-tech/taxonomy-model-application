import OccupationGroupConstants from "./constants";
import OccupationGroupEnums from "./enums";
import OccupationGroupTypes from "./types";
import OccupationGroupRegexes from "./regex";

import SchemaGETResponse from "./schema.GET.response";
import SchemaPOSTRequest from "./schema.POST.request";
import SchemaPOSTResponse from "./schema.POST.response";
import SchemaGETRequestParam from "./schema.GET.request.param";
import SchemaGETByIdRequestParam from "./schema.GET.request.ById.param";
import SchemaGETRequestQueryParam from "./schema.GET.request.query.param";
import SchemaGETResponseParent from "./schema.GET.response.parent";
import SchemaGETResponseChildren from "./schema.GET.response.children";

namespace OccupationGroupSchemas {
  export namespace GET {
    export namespace Response {
      export const Payload = SchemaGETResponse;
      export namespace Parent {
        export const Payload = SchemaGETResponseParent;
      }
      export namespace Children {
        export const Payload = SchemaGETResponseChildren;
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

namespace OccupationGroupAPISpecs {
  export import Enums = OccupationGroupEnums;
  export import Types = OccupationGroupTypes;
  export import Constants = OccupationGroupConstants;
  export import Schemas = OccupationGroupSchemas;
  export import Patterns = OccupationGroupRegexes;
}

export default OccupationGroupAPISpecs;
