// we need to disable the eslint rule here because this is a top level export
/* eslint-disable @typescript-eslint/no-unused-vars */

import LanguageConfigSchema from "./schema";
import LanguageTypes from "./types";
import LanguageConstants from "./constants";
import LanguageHelpers from "./helpers";

/**
 * This module should be imported in the following way

 import LanguageAPISpecs from "api-specifications/language";

 And the general pattern is LanguageAPISpecs.{Constants/Types/Schemas/Helpers}

 The registry is bundled, it is not fetched at runtime. See ./README.md for the checklist of adding a language.
 */

namespace LanguageSchemas {
  export const Payload = LanguageConfigSchema;
}

namespace LanguageAPISpecs {
  export import Constants = LanguageConstants;
  export import Types = LanguageTypes;
  export import Schemas = LanguageSchemas;
  export import Helpers = LanguageHelpers;
}

export default LanguageAPISpecs;
