import OccupationGroupRegexes from "../../_shared/regex";
import GETOccupationGroupChildrenOperation from "./GET";

namespace OccupationGroupChildrenAPISpecs {
  export import Patterns = OccupationGroupRegexes;
  export import GET = GETOccupationGroupChildrenOperation;
}

export default OccupationGroupChildrenAPISpecs;
