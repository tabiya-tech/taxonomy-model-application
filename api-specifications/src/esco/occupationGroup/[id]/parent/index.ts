import OccupationGroupRegexes from "../../_shared/regex";

import GETOccupationGroupParentOperation from "./GET";
import POSTOccupationGroupParentOperation from "./POST";
import PUTOccupationGroupParentOperation from "./PUT";

namespace OccupationGroupParentAPISpecs {
  export import Patterns = OccupationGroupRegexes;

  export import GET = GETOccupationGroupParentOperation;
  export import POST = POSTOccupationGroupParentOperation;
  export import PUT = PUTOccupationGroupParentOperation;
}

export default OccupationGroupParentAPISpecs;
