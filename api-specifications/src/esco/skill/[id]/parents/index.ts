import SkillConstants from "../../_shared/constants";
import SkillEnums from "../../_shared/enums";
import SkillTypes from "../../_shared/types";

import GETSkillParentsOperation from "./GET";
import POSTSkillParentsOperation from "./POST";

namespace SkillParentsAPISpecs {
  export import Constants = SkillConstants;
  export import Enums = SkillEnums;
  export import Types = SkillTypes;

  export import GET = GETSkillParentsOperation;
  export import POST = POSTSkillParentsOperation;
}

export default SkillParentsAPISpecs;
