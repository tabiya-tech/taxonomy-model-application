import SkillConstants from "./_shared/constants";
import SkillEnums from "./_shared/enums";
import SkillTypes from "./_shared/types";
import SkillRegexes from "./_shared/regex";

import GETSkillsOperation from "./GET";
import POSTSkillOperation from "./POST";
import SkillInstanceAPISpecs from "./[id]";

namespace SkillAPISpecs {
  export import Constants = SkillConstants;
  export import Enums = SkillEnums;
  export import Types = SkillTypes;
  export import Patterns = SkillRegexes;

  export import GET = GETSkillsOperation;
  export import POST = POSTSkillOperation;

  export import Skill = SkillInstanceAPISpecs;
}

export default SkillAPISpecs;
