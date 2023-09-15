// we need to disable the eslint rule here because this is a top level export
/* eslint-disable @typescript-eslint/no-unused-vars */

import LocaleResponseSchema from "./schema";
import LocaleTypes from "./types";

/**
 * This module should be imported in the following way

 import LocaleAPISpecs from "api-specifications/locale";

 And the general pattern is LocaleAPISpecs.{Schemas/Types}
 */

namespace LocaleSchemas {
    export const Payload = LocaleResponseSchema;
}

namespace LocaleAPISpecs {
    export import Types = LocaleTypes;
    export import Schemas = LocaleSchemas;
}

export default LocaleAPISpecs;