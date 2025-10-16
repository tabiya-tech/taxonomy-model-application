namespace OccupationGroupConstants {
  export const DESCRIPTION_MAX_LENGTH = 6000;
  export const CODE_MAX_LENGTH = 256;
  export const PREFERRED_LABEL_MAX_LENGTH = 256;
  export const ALT_LABELS_MAX_ITEMS = 100;
  export const ALT_LABEL_MAX_LENGTH = 256;
  export const ORIGIN_URI_MAX_LENGTH = 4096;
  export const MAX_PATH_URI_LENGTH = 4096;
  export const MAX_TABIYA_PATH_LENGTH = 4096;
  export const UUID_HISTORY_MAX_ITEMS = 10000;
  export const MAX_UUID_HISTORY_ITEM_LENGTH = 36;
  export const MAX_LIMIT = 100;
  export const MAX_CURSOR_LENGTH = 1720;

  // Safety buffer for JSON structural characters.
  // Not calculated precisely because the actual overhead is small relative to field values.
  // 10k is intentionally generous to ensure payload limit is never exceeded due to JSON formatting.
  export const MAX_JSON_OVERHEAD = 10_000;

  const TOTAL_ALT_LABELS_MAX_LENGTH = ALT_LABELS_MAX_ITEMS * ALT_LABEL_MAX_LENGTH;
  const TOTAL_UUID_HISTORY_MAX_LENGTH = UUID_HISTORY_MAX_ITEMS * MAX_UUID_HISTORY_ITEM_LENGTH;

  export const MAX_PAYLOAD_LENGTH =
    DESCRIPTION_MAX_LENGTH +
    CODE_MAX_LENGTH +
    PREFERRED_LABEL_MAX_LENGTH +
    TOTAL_ALT_LABELS_MAX_LENGTH +
    ORIGIN_URI_MAX_LENGTH +
    TOTAL_UUID_HISTORY_MAX_LENGTH +
    MAX_CURSOR_LENGTH +
    MAX_PATH_URI_LENGTH +
    MAX_TABIYA_PATH_LENGTH +
    MAX_LIMIT +
    MAX_JSON_OVERHEAD;
}

export default OccupationGroupConstants;
