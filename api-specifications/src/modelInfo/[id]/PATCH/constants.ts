import ModelInfoConstants from "../../constants";

namespace PATCHModelConstants {
  export const MAX_JSON_OVERHEAD = 1_000;
  export const MAX_PATCH_PAYLOAD_LENGTH = ModelInfoConstants.RELEASE_NOTES_MAX_LENGTH + MAX_JSON_OVERHEAD;
}

export default PATCHModelConstants;
