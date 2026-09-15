// we need to disable the eslint rule here because this is a top level export
/* eslint-disable @typescript-eslint/no-unused-vars */

import LanguageConfigSchema from "./schema";
import LanguageTypes from "./types";
import LanguageConstants from "./constants";
import LanguageHelpers from "./helpers";
import { getTranslatedStringArraySchema, getTranslatedStringSchema } from "./translatedString";

/**
 * This module should be imported in the following way

 import LanguageAPISpecs from "api-specifications/language";

 And the general pattern is LanguageAPISpecs.{Constants/Types/Schemas/Helpers}

 The registry is bundled, it is not fetched at runtime. See ./README.md for the checklist of adding a language.

 The module also carries the translated string primitives, the representation of a value that is translated in the
 languages of the registry. A translated value is keyed by a language, it is never keyed by a locale, see the locale
 module for the locales a model author picks from.
 */

namespace LanguageSchemas {
  export const Payload = LanguageConfigSchema;
  /** Builds the schema of a translated value, see ./translatedString.ts */
  export const getTranslatedString = getTranslatedStringSchema;
  /** Builds the schema of a list of translated values, see ./translatedString.ts */
  export const getTranslatedStringArray = getTranslatedStringArraySchema;
}

namespace LanguageAPISpecs {
  export import Constants = LanguageConstants;
  export import Types = LanguageTypes;
  export import Schemas = LanguageSchemas;
  export import Helpers = LanguageHelpers;
}

export default LanguageAPISpecs;
