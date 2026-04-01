import OccupationGroupRegexes from "../../_shared/regex";

import GETOccupationGroupParentOperation from "./GET";

namespace OccupationGroupParentAPISpecs {
  export import Patterns = OccupationGroupRegexes;

  export import GET = GETOccupationGroupParentOperation;
}

export default OccupationGroupParentAPISpecs;
