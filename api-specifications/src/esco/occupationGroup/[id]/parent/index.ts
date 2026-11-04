import OccupationGroupRegexes from "../../_shared/regex";

import GETOccupationGroupParentOperation from "./GET";
import POSTOccupationGroupParentOperation from "./POST";
import PUTOccupationGroupParentOperation from "./PUT";
import PATCHOccupationGroupParentOperation from "./PATCH";
import DELETEOccupationGroupParentOperation from "./DELETE";

namespace OccupationGroupParentAPISpecs {
  export import Patterns = OccupationGroupRegexes;

  export import GET = GETOccupationGroupParentOperation;
  export import POST = POSTOccupationGroupParentOperation;
  export import PUT = PUTOccupationGroupParentOperation;
  export import PATCH = PATCHOccupationGroupParentOperation;
  export import DELETE = DELETEOccupationGroupParentOperation;
}

export default OccupationGroupParentAPISpecs;
