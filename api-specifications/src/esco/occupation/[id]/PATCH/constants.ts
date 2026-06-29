import OccupationConstants from "../../_shared/constants";

namespace PATCHOccupationConstants {
  export const MAX_JSON_OVERHEAD = 10_000;

  export const MAX_PATCH_PAYLOAD_LENGTH =
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

export default PATCHOccupationConstants;
