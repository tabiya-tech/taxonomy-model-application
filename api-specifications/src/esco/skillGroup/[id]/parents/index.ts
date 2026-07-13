import SkillGroupRegexes from "../../_shared/regex";

import GETSGroupParentOperation from "./GET";
import POSTSkillGroupParentOperation from "./POST";

namespace SkillGroupParentAPISpecs {
  export import Patterns = SkillGroupRegexes;

  export import GET = GETSGroupParentOperation;
  export import POST = POSTSkillGroupParentOperation;
}

export default SkillGroupParentAPISpecs;
