import SkillConstants from "../../_shared/constants";

namespace PUTSkillConstants {
  export const MAX_JSON_OVERHEAD = 10_000;

  export const MAX_PUT_PAYLOAD_LENGTH =
    SkillConstants.DESCRIPTION_MAX_LENGTH +
    SkillConstants.DEFINITION_MAX_LENGTH +
    SkillConstants.PREFERRED_LABEL_MAX_LENGTH +
    SkillConstants.ALT_LABELS_MAX_ITEMS * SkillConstants.ALT_LABEL_MAX_LENGTH +
    SkillConstants.ORIGIN_URI_MAX_LENGTH +
    SkillConstants.SCOPE_NOTE_MAX_LENGTH +
    SkillConstants.UUID_HISTORY_MAX_ITEMS * SkillConstants.UUID_HISTORY_MAX_LENGTH +
    MAX_JSON_OVERHEAD;
}

export default PUTSkillConstants;
