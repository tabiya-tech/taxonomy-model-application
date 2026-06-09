import SkillConstants from "../../_shared/constants";
import SkillEnums from "../../_shared/enums";
import SkillTypes from "../../_shared/types";

import GETRelatedSkillsOperation from "./GET";
import POSTRelatedSkillsOperation from "./POST";

namespace SkillRelatedSkillsAPISpecs {
  export import Constants = SkillConstants;
  export import Enums = SkillEnums;
  export import Types = SkillTypes;

  export import GET = GETRelatedSkillsOperation;
  export import POST = POSTRelatedSkillsOperation;
}

export default SkillRelatedSkillsAPISpecs;
