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
import SchemaGETParentResponse from "./relations/parents/schema.GET.parent.response";
import SchemaGETChildrenResponse from "./relations/children/schema.GET.children.response";
import SchemaGETChildrenRequestQueryParam from "./relations/children/schema.GET.children.request.query.param";
import SchemaGETSkillsResponse from "./relations/skills/schema.GET.skills.response";
import SchemaGETSkillsRequestQueryParam from "./relations/skills/schema.GET.skills.request.query.param";

namespace OccupationSchemas {
  export namespace GET {
    export namespace Response {
      export const Payload = SchemaGETResponse;
    }
    export namespace Parent {
      export namespace Response {
        export const Payload = SchemaGETParentResponse;
      }
    }
    export namespace Children {
      export namespace Response {
        export const Payload = SchemaGETChildrenResponse;
      }
      export namespace Request {
        export namespace Query {
          export const Payload = SchemaGETChildrenRequestQueryParam;
        }
      }
    }
    export namespace Skills {
      export namespace Response {
        export const Payload = SchemaGETSkillsResponse;
      }
      export namespace Request {
        export namespace Query {
          export const Payload = SchemaGETSkillsRequestQueryParam;
        }
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
