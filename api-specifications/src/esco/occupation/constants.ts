namespace OccupationConstants {
  // Text field max lengths
  export const DESCRIPTION_MAX_LENGTH = 4000;
  export const DEFINITION_MAX_LENGTH = 4000;
  export const PREFERRED_LABEL_MAX_LENGTH = 256;
  export const ALT_LABEL_MAX_LENGTH = 256;
  export const REGULATED_PROFESSION_NOTE_MAX_LENGTH = 4000;
  export const SCOPE_NOTE_MAX_LENGTH = 4000;
  export const CODE_MAX_LENGTH = 256;
  export const OCCUPATION_GROUP_CODE_MAX_LENGTH = 256;
  export const ORIGIN_URI_MAX_LENGTH = 4096;
  export const PATH_URI_MAX_LENGTH = 4096;
  export const TABIYA_PATH_URI_MAX_LENGTH = 4096;

  // Array constraints
  export const ALT_LABELS_MAX_ITEMS = 100;
  export const UUID_HISTORY_MAX_ITEMS = 10000;
  export const UUID_HISTORY_MAX_LENGTH = 50;

  // Pagination constraints
  export const MAX_LIMIT = 100;
  export const MAX_CURSOR_LENGTH = 1024;

  // Computed totals for internal use
  const TOTAL_ALT_LABELS_MAX_LENGTH = ALT_LABELS_MAX_ITEMS * ALT_LABEL_MAX_LENGTH;
  const TOTAL_UUID_HISTORY_MAX_LENGTH = UUID_HISTORY_MAX_ITEMS * UUID_HISTORY_MAX_LENGTH;

  // Safety buffer for JSON structural characters.
  // Not calculated precisely because the actual overhead is small relative to field values.
  // 10k is intentionally generous to ensure payload limit is never exceeded due to JSON formatting.
  export const MAX_JSON_OVERHEAD = 10_000;

  // Max payload length
  export const MAX_PAYLOAD_LENGTH =
    DESCRIPTION_MAX_LENGTH +
    DEFINITION_MAX_LENGTH +
    PREFERRED_LABEL_MAX_LENGTH +
    TOTAL_ALT_LABELS_MAX_LENGTH +
    ORIGIN_URI_MAX_LENGTH +
    PATH_URI_MAX_LENGTH +
    TABIYA_PATH_URI_MAX_LENGTH +
    SCOPE_NOTE_MAX_LENGTH +
    REGULATED_PROFESSION_NOTE_MAX_LENGTH +
    CODE_MAX_LENGTH +
    OCCUPATION_GROUP_CODE_MAX_LENGTH +
    TOTAL_UUID_HISTORY_MAX_LENGTH +
    MAX_LIMIT +
    MAX_CURSOR_LENGTH +
    MAX_JSON_OVERHEAD;
}

export default OccupationConstants;
