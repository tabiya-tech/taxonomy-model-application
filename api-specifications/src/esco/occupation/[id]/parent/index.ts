import OccupationConstants from "../../_shared/constants";
import OccupationEnums from "../../_shared/enums";
import OccupationTypes from "../../_shared/types";
import OccupationRegexes from "../../_shared/regex";

import GETOccupationParentsOperation from "./GET";
import POSTOccupationParentOperation from "./POST";
import PATCHOccupationParentOperation from "./PATCH";

namespace OccupationParentAPISpecs {
  export import Constants = OccupationConstants;
  export import Enums = OccupationEnums;
  export import Types = OccupationTypes;
  export import Patterns = OccupationRegexes;

  export import GET = GETOccupationParentsOperation;
  export import POST = POSTOccupationParentOperation;
  export import PATCH = PATCHOccupationParentOperation;
}

export default OccupationParentAPISpecs;
