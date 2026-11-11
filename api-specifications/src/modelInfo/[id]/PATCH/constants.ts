import ModelInfoConstants from "../../constants";
import LocaleConstants from "../../../locale/constants";

namespace PATCHModelConstants {
  export const MAX_JSON_OVERHEAD = 1_000;

  // 10,000 UUID strings × (36 chars per UUID + 4 bytes of JSON punctuation: quotes and comma)
  const UUID_HISTORY_MAX_PAYLOAD_LENGTH = 10_000 * (36 + 4);

  export const MAX_PATCH_PAYLOAD_LENGTH =
    ModelInfoConstants.NAME_MAX_LENGTH +
    ModelInfoConstants.DESCRIPTION_MAX_LENGTH +
    ModelInfoConstants.RELEASE_NOTES_MAX_LENGTH +
    ModelInfoConstants.LICENSE_MAX_LENGTH +
    LocaleConstants.LOCALE_SHORTCODE_MAX_LENGTH +
    LocaleConstants.NAME_MAX_LENGTH +
    UUID_HISTORY_MAX_PAYLOAD_LENGTH +
    ModelInfoConstants.AVAILABLE_LANGUAGES_MAX_PAYLOAD_LENGTH +
    MAX_JSON_OVERHEAD;
}

export default PATCHModelConstants;
