import OccupationConstants from "../../_shared/constants";
import OccupationEnums from "../../_shared/enums";
import OccupationTypes from "../../_shared/types";
import OccupationRegexes from "../../_shared/regex";

import GETOccupationHistoryOperation from "./GET";

namespace OccupationHistoryAPISpecs {
  export import Constants = OccupationConstants;
  export import Enums = OccupationEnums;
  export import Types = OccupationTypes;
  export import Patterns = OccupationRegexes;

  export import GET = GETOccupationHistoryOperation;
}

export default OccupationHistoryAPISpecs;
