import SkillGroupConstants from "../../_shared/constants";

namespace PUTSkillGroupConstants {
  export const DESCRIPTION_MAX_LENGTH = SkillGroupConstants.DESCRIPTION_MAX_LENGTH;
  export const CODE_MAX_LENGTH = SkillGroupConstants.CODE_MAX_LENGTH;
  export const PREFERRED_LABEL_MAX_LENGTH = SkillGroupConstants.PREFERRED_LABEL_MAX_LENGTH;
  export const TOTAL_ALT_LABELS_MAX_LENGTH =
    SkillGroupConstants.ALT_LABELS_MAX_ITEMS * SkillGroupConstants.ALT_LABEL_MAX_LENGTH;
  export const ORIGIN_URI_MAX_LENGTH = SkillGroupConstants.ORIGIN_URI_MAX_LENGTH;
  export const TOTAL_UUID_HISTORY_MAX_LENGTH =
    SkillGroupConstants.UUID_HISTORY_MAX_ITEMS * SkillGroupConstants.MAX_UUID_HISTORY_ITEM_LENGTH;
  export const MAX_SCOPE_NOTE_LENGTH = SkillGroupConstants.MAX_SCOPE_NOTE_LENGTH;
  export const MAX_PATH_URI_LENGTH = SkillGroupConstants.MAX_PATH_URI_LENGTH;
  export const MAX_TABIYA_PATH_LENGTH = SkillGroupConstants.MAX_TABIYA_PATH_LENGTH;
  export const MAX_JSON_OVERHEAD = 10_000;
  export const MAX_PUT_PAYLOAD_LENGTH =
    DESCRIPTION_MAX_LENGTH +
    CODE_MAX_LENGTH +
    PREFERRED_LABEL_MAX_LENGTH +
    TOTAL_ALT_LABELS_MAX_LENGTH +
    ORIGIN_URI_MAX_LENGTH +
    TOTAL_UUID_HISTORY_MAX_LENGTH +
    MAX_SCOPE_NOTE_LENGTH +
    MAX_PATH_URI_LENGTH +
    MAX_TABIYA_PATH_LENGTH +
    MAX_JSON_OVERHEAD;
}

export default PUTSkillGroupConstants;
