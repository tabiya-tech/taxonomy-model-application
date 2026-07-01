import SkillConstants from "../../_shared/constants";
import SkillEnums from "../../_shared/enums";
import SkillTypes from "../../_shared/types";

import GETSkillHistoryOperation from "./GET";

namespace SkillHistoryAPISpecs {
  export import Constants = SkillConstants;
  export import Enums = SkillEnums;
  export import Types = SkillTypes;

  export import GET = GETSkillHistoryOperation;
}

export default SkillHistoryAPISpecs;
