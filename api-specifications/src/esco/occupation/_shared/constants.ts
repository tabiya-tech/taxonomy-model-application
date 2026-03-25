namespace OccupationConstants {
  // Text field max lengths
  export const DESCRIPTION_MAX_LENGTH = 6000;
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

  // Pagination constraints (shared across all GET operations)
  export const DEFAULT_LIMIT = 10;
  export const MAX_LIMIT = 100;
  export const MAX_CURSOR_LENGTH = 1024;

  // Signalling value constraints (used in skill-relation response schema)
  export const SIGNALLING_VALUE_MIN = 0;
  export const SIGNALLING_VALUE_MAX = 100;
  export const SIGNALLING_VALUE_LABEL_MAX_LENGTH = 256;
}

export default OccupationConstants;
