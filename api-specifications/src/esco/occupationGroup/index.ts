import OccupationGroupConstants from "./constants";
import OccupationGroupEnums from "./enums";
import OccupationGroupParentEnums from "./relations/parent/enum";
import OccupationGroupChildrenEnums from "./relations/children/enum";
import OccupationGroupTypes from "./types";
import OccupationGroupRegexes from "./regex";

import SchemaGETResponse from "./schema.GET.response";
import SchemaPOSTRequest from "./schema.POST.request";
import SchemaPOSTResponse from "./schema.POST.response";
import SchemaGETRequestParam from "./schema.GET.request.param";
import SchemaGETByIdRequestParam from "./schema.GET.request.ById.param";
import SchemaGETRequestQueryParam from "./schema.GET.request.query.param";
import SchemaGETParentResponse from "./relations/parent/schema.GET.parent.response";
import SchemaGETChildrenResponse from "./schema.GET.children.response";
import SchemaGETChildResponse from "./relations/children/schema.GET.child.response";

namespace OccupationGroupSchemas {
  export namespace GET {
    export namespace Response {
      export const Payload = SchemaGETResponse;
      export namespace Parent {
        export const Payload = SchemaGETParentResponse;
      }
      export namespace Child {
        export const Payload = SchemaGETChildResponse;
      }
      export namespace Children {
        export const Payload = SchemaGETChildrenResponse;
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
  export import ParentEnums = OccupationGroupParentEnums;
  export import ChildrenEnums = OccupationGroupChildrenEnums;
}

export default OccupationGroupAPISpecs;
