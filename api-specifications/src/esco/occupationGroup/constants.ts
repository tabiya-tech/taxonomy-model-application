import ModelInfoConstants from "modelInfo/constants";

namespace OccupationGroupConstants {
  export const DESCRIPTION_MAX_LENGTH = 4000;
  export const CODE_MAX_LENGTH = 256;
  export const PREFERRED_LABEL_MAX_LENGTH = 256;
  export const ALT_LABELS_MAX_ITEMS = 100;
  export const ALT_LABEL_MAX_LENGTH = 256;
  export const MAX_URI_LENGTH = 4096;
  export const IMPORT_ID_MAX_LENGTH = 256;

  export const MAX_PAYLOAD_LENGTH =
    DESCRIPTION_MAX_LENGTH +
    CODE_MAX_LENGTH +
    PREFERRED_LABEL_MAX_LENGTH +
    ALT_LABELS_MAX_ITEMS +
    ALT_LABEL_MAX_LENGTH +
    MAX_URI_LENGTH +
    IMPORT_ID_MAX_LENGTH +
    ModelInfoConstants.DESCRIPTION_MAX_LENGTH +
    ModelInfoConstants.NAME_MAX_LENGTH +
    ModelInfoConstants.VERSION_MAX_LENGTH +
    10_000; // For object keys (taken randomly)
}

export default OccupationGroupConstants;
