import OccupationConstants from "../../_shared/constants";
import OccupationEnums from "../../_shared/enums";
import OccupationTypes from "../../_shared/types";
import OccupationRegexes from "../../_shared/regex";

import GETOccupationChildrenOperation from "./GET";

namespace OccupationChildrenAPISpecs {
  export import Constants = OccupationConstants;
  export import Enums = OccupationEnums;
  export import Types = OccupationTypes;
  export import Patterns = OccupationRegexes;

  export import GET = GETOccupationChildrenOperation;
}

export default OccupationChildrenAPISpecs;
