import SkillGroupConstants from "./_shared/constants";
import SkillGroupEnums from "./_shared/enums";
import SkillGroupTypes from "./_shared/types";
import SkillGroupRegexes from "./_shared/regex";

import SkillGroupPOSTAPISpecs from "./POST/index";
import SkillGroupGETAPISpecs from "./GET/index";
import SkillGroupDetailAPISpecs from "./[id]/index";

namespace SkillGroupAPISpecs {
  export import Enums = SkillGroupEnums;
  export import Types = SkillGroupTypes;
  export import Constants = SkillGroupConstants;
  export import Patterns = SkillGroupRegexes;

  export import POST = SkillGroupPOSTAPISpecs;
  export import GET = SkillGroupGETAPISpecs;

  export import SkillGroup = SkillGroupDetailAPISpecs;
}

export default SkillGroupAPISpecs;
