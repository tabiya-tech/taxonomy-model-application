import OccupationGroupRegexes from "../../_shared/regex";

import GETOccupationGroupParentOperation from "./GET";
import POSTOccupationGroupParentTypes from "./POST";

namespace OccupationGroupParentAPISpecs {
  export import Patterns = OccupationGroupRegexes;

  export import GET = GETOccupationGroupParentOperation;
  export import POST = POSTOccupationGroupParentTypes;
}

export default OccupationGroupParentAPISpecs;
