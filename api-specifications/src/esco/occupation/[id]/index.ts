import OccupationConstants from "../_shared/constants";
import OccupationEnums from "../_shared/enums";
import OccupationTypes from "../_shared/types";
import OccupationRegexes from "../_shared/regex";

import GETOccupationByIdOperation from "./GET";
import OccupationParentAPISpecs from "./parent";
import OccupationChildrenAPISpecs from "./children";
import OccupationSkillsAPISpecs from "./skills";
import OccupationHistoryAPISpecs from "./history";

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
  export import Parent = OccupationParentAPISpecs;
  export import Children = OccupationChildrenAPISpecs;
  export import Skills = OccupationSkillsAPISpecs;
  export import History = OccupationHistoryAPISpecs;
}

export default OccupationInstanceAPISpecs;
