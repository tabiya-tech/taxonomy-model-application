import OccupationGroupRegexes from "../../_shared/regex";

import GETOccupationGroupHistoryOperation from "./GET";

namespace OccupationGroupHistoryAPISpecs {
  export import Patterns = OccupationGroupRegexes;

  export import GET = GETOccupationGroupHistoryOperation;
}

export default OccupationGroupHistoryAPISpecs;
