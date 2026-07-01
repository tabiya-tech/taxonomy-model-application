import SkillGroupRegexes from "../../_shared/regex";

import GETSkillGroupHistoryOperation from "./GET";

namespace SkillGroupHistoryAPISpecs {
  export import Patterns = SkillGroupRegexes;

  export import GET = GETSkillGroupHistoryOperation;
}

export default SkillGroupHistoryAPISpecs;
