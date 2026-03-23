import OccupationGroupConstants from "./_shared/constants";
import OccupationGroupEnums from "./_shared/enums";
import OccupationGroupTypes from "./_shared/types";
import OccupationGroupRegexes from "./_shared/regex";

import OccupationGroupPOSTAPISpecs from "./POST/index";
import OccupationGroupGETAPISpecs from "./GET/index";
import OccupationGroupDetailAPISpecs from "./[id]/index";

namespace OccupationGroupAPISpecs {
  export import Enums = OccupationGroupEnums;
  export import Types = OccupationGroupTypes;
  export import Constants = OccupationGroupConstants;
  export import Patterns = OccupationGroupRegexes;

  export import POSTAPISpecs = OccupationGroupPOSTAPISpecs;
  export import GETAPISpecs = OccupationGroupGETAPISpecs;
  export import GETDetailAPISpecs = OccupationGroupDetailAPISpecs;
}

export default OccupationGroupAPISpecs;
