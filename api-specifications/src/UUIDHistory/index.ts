// we need to disable the eslint rule here because this is a top level export
/* eslint-disable @typescript-eslint/no-unused-vars */

import UUIDHistoryTypes from "./types";
import UUIDHistoryConstants from "./constants";
import UUIDHistoryEnums from "./enums";

import SchemaGETResponse from "./schema.GET.response";
import SchemaGETRequest from "./schema.GET.request";

/**
 *  This file should be imported in the following way
 *
 *  import UUIDHistoryAPISpecs from "api-specifications/UUIDHistory";
 *
 *  And the general pattern is UUIDHistoryAPISpecs.{Schemas/Types/Enums/Constants}.[VERB].{Request/Response}
 */

namespace UUIDHistorySchemas {
  export namespace GET {
    export namespace Response {
      export const Payload = SchemaGETResponse;
    }
    export namespace Request {
      export const Payload = SchemaGETRequest;
    }
  }
}
namespace UUIDHistoryAPISpecs {
  export import Enums = UUIDHistoryEnums;
  export import Constants = UUIDHistoryConstants;
  export import Types = UUIDHistoryTypes;
  export import Schemas = UUIDHistorySchemas;
}

export default UUIDHistoryAPISpecs;
