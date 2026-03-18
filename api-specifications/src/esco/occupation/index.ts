import OccupationConstants from "./_shared/constants";
import OccupationEnums from "./_shared/enums";
import OccupationTypes from "./_shared/types";
import OccupationRegexes from "./_shared/regex";

import GETOccupationsOperation from "./GET";
import POSTOccupationOperation from "./POST";
import OccupationInstanceAPISpecs from "./[id]";

namespace OccupationAPISpecs {
  export import Constants = OccupationConstants;
  export import Enums = OccupationEnums;
  export import Types = OccupationTypes;
  export import Patterns = OccupationRegexes;

  // Collection-level operations
  export import GETOccupations = GETOccupationsOperation;
  export import POSTOccupation = POSTOccupationOperation;

  // Instance-level operations (via [id] concept)
  export import Detail = OccupationInstanceAPISpecs;
}

export default OccupationAPISpecs;
