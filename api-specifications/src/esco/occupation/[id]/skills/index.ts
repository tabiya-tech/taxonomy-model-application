import OccupationConstants from "../../_shared/constants";
import OccupationEnums from "../../_shared/enums";
import OccupationTypes from "../../_shared/types";
import OccupationRegexes from "../../_shared/regex";

import GETOccupationSkillsOperation from "./GET";

namespace OccupationSkillsAPISpecs {
  export import Constants = OccupationConstants;
  export import Enums = OccupationEnums;
  export import Types = OccupationTypes;
  export import Patterns = OccupationRegexes;

  export import GET = GETOccupationSkillsOperation;
}

export default OccupationSkillsAPISpecs;
