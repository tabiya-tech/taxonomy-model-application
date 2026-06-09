import SkillConstants from "../../_shared/constants";
import SkillEnums from "../../_shared/enums";
import SkillTypes from "../../_shared/types";

import GETSkillOccupationsOperation from "./GET";
import POSTSkillOccupationsOperation from "./POST";

namespace SkillOccupationsAPISpecs {
  export import Constants = SkillConstants;
  export import Enums = SkillEnums;
  export import Types = SkillTypes;

  export import GET = GETSkillOccupationsOperation;
  export import POST = POSTSkillOccupationsOperation;
}

export default SkillOccupationsAPISpecs;
