import OccupationGroupRegexes from "../../_shared/regex";

import GETOccupationGroupParentOperation from "./GET";
import POSTOccupationGroupParentOperation from "./POST";

namespace OccupationGroupParentAPISpecs {
  export import Patterns = OccupationGroupRegexes;

  export import GET = GETOccupationGroupParentOperation;
  export import POST = POSTOccupationGroupParentOperation;
}

export default OccupationGroupParentAPISpecs;
