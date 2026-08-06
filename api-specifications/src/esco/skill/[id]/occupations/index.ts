import SkillConstants from "../../_shared/constants";
import SkillEnums from "../../_shared/enums";
import SkillTypes from "../../_shared/types";

import GETSkillOccupationsOperation from "./GET";
import POSTSkillOccupationsOperation from "./POST";
import PATCHSkillOccupationsOperation from "./PATCH";

namespace SkillOccupationsAPISpecs {
  export import Constants = SkillConstants;
  export import Enums = SkillEnums;
  export import Types = SkillTypes;

  export import GET = GETSkillOccupationsOperation;
  export import POST = POSTSkillOccupationsOperation;
  export import PATCH = PATCHSkillOccupationsOperation;
}

export default SkillOccupationsAPISpecs;
