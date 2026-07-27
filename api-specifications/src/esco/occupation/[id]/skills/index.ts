import OccupationConstants from "../../_shared/constants";
import OccupationEnums from "../../_shared/enums";
import OccupationTypes from "../../_shared/types";
import OccupationRegexes from "../../_shared/regex";

import GETOccupationSkillsOperation from "./GET";
import POSTOccupationSkillsOperation from "./POST";
import PATCHOccupationSkillsOperation from "./PATCH";

namespace OccupationSkillsAPISpecs {
  export import Constants = OccupationConstants;
  export import Enums = OccupationEnums;
  export import Types = OccupationTypes;
  export import Patterns = OccupationRegexes;

  export import GET = GETOccupationSkillsOperation;
  export import POST = POSTOccupationSkillsOperation;
  export import PATCH = PATCHOccupationSkillsOperation;
}

export default OccupationSkillsAPISpecs;
