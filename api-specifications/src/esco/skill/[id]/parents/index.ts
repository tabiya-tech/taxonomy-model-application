import SkillConstants from "../../_shared/constants";
import SkillEnums from "../../_shared/enums";
import SkillTypes from "../../_shared/types";

import GETSkillParentsOperation from "./GET";

namespace SkillParentsAPISpecs {
  export import Constants = SkillConstants;
  export import Enums = SkillEnums;
  export import Types = SkillTypes;

  export import GET = GETSkillParentsOperation;
}

export default SkillParentsAPISpecs;
