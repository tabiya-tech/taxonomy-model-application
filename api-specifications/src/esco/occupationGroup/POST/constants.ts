import OccupationGroupConstants from "../_shared/constants";

namespace OccupationGroupPOSTConstants {
  export const DESCRIPTION_MAX_LENGTH = OccupationGroupConstants.DESCRIPTION_MAX_LENGTH;
  export const CODE_MAX_LENGTH = OccupationGroupConstants.CODE_MAX_LENGTH;
  export const PREFERRED_LABEL_MAX_LENGTH = OccupationGroupConstants.PREFERRED_LABEL_MAX_LENGTH;
  export const TOTAL_ALT_LABELS_MAX_LENGTH =
    OccupationGroupConstants.ALT_LABELS_MAX_ITEMS * OccupationGroupConstants.ALT_LABEL_MAX_LENGTH;
  export const ORIGIN_URI_MAX_LENGTH = OccupationGroupConstants.ORIGIN_URI_MAX_LENGTH;
  export const TOTAL_UUID_HISTORY_MAX_LENGTH =
    OccupationGroupConstants.UUID_HISTORY_MAX_ITEMS * OccupationGroupConstants.MAX_UUID_HISTORY_ITEM_LENGTH;
  export const MAX_PATH_URI_LENGTH = OccupationGroupConstants.MAX_PATH_URI_LENGTH;
  export const MAX_TABIYA_PATH_LENGTH = OccupationGroupConstants.MAX_TABIYA_PATH_LENGTH;
  export const MAX_JSON_OVERHEAD = 10_000;
  export const MAX_POST_PAYLOAD_LENGTH =
    DESCRIPTION_MAX_LENGTH +
    CODE_MAX_LENGTH +
    PREFERRED_LABEL_MAX_LENGTH +
    TOTAL_ALT_LABELS_MAX_LENGTH +
    ORIGIN_URI_MAX_LENGTH +
    TOTAL_UUID_HISTORY_MAX_LENGTH +
    MAX_PATH_URI_LENGTH +
    MAX_TABIYA_PATH_LENGTH +
    MAX_JSON_OVERHEAD;
}

export default OccupationGroupPOSTConstants;
