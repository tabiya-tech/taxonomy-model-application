import SkillGroupConstants from "./_shared/constants";
import SkillGroupEnums from "./_shared/enums";
import SkillGroupTypes from "./_shared/types";
import SkillGroupRegexes from "./_shared/regex";
import SchemaSkillGroupReference from "./_shared/schema.reference";

import SkillGroupPOSTAPISpecs from "./POST/index";
import SkillGroupGETAPISpecs from "./GET/index";
import SkillGroupDetailAPISpecs from "./[id]/index";

namespace SkillGroupAPISpecs {
  export import Enums = SkillGroupEnums;
  export import Types = SkillGroupTypes;
  export import Constants = SkillGroupConstants;
  export import Patterns = SkillGroupRegexes;

  // Shared, cross-endpoint schemas
  export namespace Schemas {
    export const Reference = SchemaSkillGroupReference;
  }

  export import POST = SkillGroupPOSTAPISpecs;
  export import GET = SkillGroupGETAPISpecs;

  export import SkillGroup = SkillGroupDetailAPISpecs;
}

export default SkillGroupAPISpecs;
