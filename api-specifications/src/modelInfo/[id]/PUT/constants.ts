import ModelInfoConstants from "../../constants";
import LocaleConstants from "../../../locale/constants";

namespace PUTModelConstants {
  export const UUID_HISTORY_MAX_ITEMS = 10000;
  export const UUID_HISTORY_ITEM_MAX_LENGTH = 36;
  export const MAX_JSON_OVERHEAD = 1_000;
  export const TOTAL_UUID_HISTORY_MAX_LENGTH = UUID_HISTORY_MAX_ITEMS * UUID_HISTORY_ITEM_MAX_LENGTH;
  export const MAX_PUT_PAYLOAD_LENGTH =
    ModelInfoConstants.NAME_MAX_LENGTH +
    ModelInfoConstants.DESCRIPTION_MAX_LENGTH +
    ModelInfoConstants.LICENSE_MAX_LENGTH +
    LocaleConstants.NAME_MAX_LENGTH +
    LocaleConstants.LOCALE_SHORTCODE_MAX_LENGTH +
    ModelInfoConstants.AVAILABLE_LANGUAGES_MAX_PAYLOAD_LENGTH +
    TOTAL_UUID_HISTORY_MAX_LENGTH +
    MAX_JSON_OVERHEAD;
}

export default PUTModelConstants;
