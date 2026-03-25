import OccupationConstants from "../_shared/constants";

namespace POSTOccupationConstants {
  // Safety buffer for JSON structural characters.
  // Not calculated precisely because the actual overhead is small relative to field values.
  // 10k is intentionally generous to ensure payload limit is never exceeded due to JSON formatting.
  export const MAX_JSON_OVERHEAD = 10_000;

  // Max payload length — computed from shared field-length constants
  export const MAX_POST_PAYLOAD_LENGTH =
    OccupationConstants.DESCRIPTION_MAX_LENGTH +
    OccupationConstants.DEFINITION_MAX_LENGTH +
    OccupationConstants.PREFERRED_LABEL_MAX_LENGTH +
    OccupationConstants.ALT_LABELS_MAX_ITEMS * OccupationConstants.ALT_LABEL_MAX_LENGTH +
    OccupationConstants.ORIGIN_URI_MAX_LENGTH +
    OccupationConstants.PATH_URI_MAX_LENGTH +
    OccupationConstants.TABIYA_PATH_URI_MAX_LENGTH +
    OccupationConstants.SCOPE_NOTE_MAX_LENGTH +
    OccupationConstants.REGULATED_PROFESSION_NOTE_MAX_LENGTH +
    OccupationConstants.CODE_MAX_LENGTH +
    OccupationConstants.OCCUPATION_GROUP_CODE_MAX_LENGTH +
    OccupationConstants.UUID_HISTORY_MAX_ITEMS * OccupationConstants.UUID_HISTORY_MAX_LENGTH +
    MAX_JSON_OVERHEAD;
}

export default POSTOccupationConstants;
