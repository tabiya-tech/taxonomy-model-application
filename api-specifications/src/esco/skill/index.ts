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

// Relation schemas
import SchemaGETParentResponse from "./relations/parents/schema.GET.parent.response";
import SchemaGETParentsRequestQuery from "./relations/parents/schema.GET.parents.request.query.param";
import SchemaGETChildrenResponse from "./relations/children/schema.GET.children.response";
import SchemaGETChildrenRequestQuery from "./relations/children/schema.GET.children.request.query.param";
import SchemaGETOccupationsResponse from "./relations/occupations/schema.GET.occupations.response";
import SchemaGETOccupationsRequestQuery from "./relations/occupations/schema.GET.occupations.request.query.param";
import SchemaGETRelatedResponse from "./relations/related/schema.GET.related.response";
import SchemaGETRelatedRequestQuery from "./relations/related/schema.GET.related.request.query.param";

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
    // Relation schemas
    export namespace Parents {
      export namespace Response {
        export const Payload = SchemaGETParentResponse;
      }
      export namespace Request {
        export namespace Query {
          export const Payload = SchemaGETParentsRequestQuery;
        }
      }
    }
    export namespace Children {
      export namespace Response {
        export const Payload = SchemaGETChildrenResponse;
      }
      export namespace Request {
        export namespace Query {
          export const Payload = SchemaGETChildrenRequestQuery;
        }
      }
    }
    export namespace Occupations {
      export namespace Response {
        export const Payload = SchemaGETOccupationsResponse;
      }
      export namespace Request {
        export namespace Query {
          export const Payload = SchemaGETOccupationsRequestQuery;
        }
      }
    }
    export namespace Related {
      export namespace Response {
        export const Payload = SchemaGETRelatedResponse;
      }
      export namespace Request {
        export namespace Query {
          export const Payload = SchemaGETRelatedRequestQuery;
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
