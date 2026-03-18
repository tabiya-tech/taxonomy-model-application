import OccupationConstants from "../_shared/constants";
import OccupationEnums from "../_shared/enums";
import OccupationTypes from "../_shared/types";
import OccupationRegexes from "../_shared/regex";

import GETOccupationByIdOperation from "./GET";
import OccupationParentAPISpecs from "./parent";
import OccupationChildrenAPISpecs from "./children";
import OccupationSkillsAPISpecs from "./skills";

// Concept aggregator for [id] (Occupation Instance)
namespace OccupationInstanceAPISpecs {
  export import Constants = OccupationConstants;
  export import Enums = OccupationEnums;
  export import Types = OccupationTypes;
  export import Patterns = OccupationRegexes;

  export import GET = GETOccupationByIdOperation;
  // Placeholders for future methods
  // export import PUT = PUTOccupationOperation;
  // export import DELETE = DELETEOccupationOperation;

  // Child API Paths
  export import parent = OccupationParentAPISpecs;
  export import children = OccupationChildrenAPISpecs;
  export import skills = OccupationSkillsAPISpecs;
}

export default OccupationInstanceAPISpecs;
