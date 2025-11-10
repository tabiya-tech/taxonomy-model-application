import LocaleConstants from "../locale/constants";

namespace ModelInfoConstants {
  export const NAME_MAX_LENGTH = 256;
  export const DESCRIPTION_MAX_LENGTH = 6000;
  export const RELEASE_NOTES_MAX_LENGTH = 100000;
  export const LICENSE_MAX_LENGTH = 100000;
  export const VERSION_MAX_LENGTH = 256;
  export const MAX_URI_LENGTH = 4096;

  export const MAX_POST_PAYLOAD_LENGTH =
    NAME_MAX_LENGTH +
    DESCRIPTION_MAX_LENGTH +
    RELEASE_NOTES_MAX_LENGTH +
    LICENSE_MAX_LENGTH +
    VERSION_MAX_LENGTH +
    MAX_URI_LENGTH +
    LocaleConstants.LOCALE_SHORTCODE_MAX_LENGTH +
    LocaleConstants.NAME_MAX_LENGTH +
    10_000; // For object keys (taken randomly)
}

export default ModelInfoConstants;
