import { RegExp_Base64, RegExp_Str_Base64 } from "../../regex";
import { RegExp_Str_Skill_Group_Code, RegExp_Skill_Group_Code } from "../common/regex";

namespace SkillGroupRegexes {
  export namespace Str {
    export const BASE64 = RegExp_Str_Base64;
    export const SKILL_GROUP_CODE = RegExp_Str_Skill_Group_Code;
  }
  export namespace RegExp {
    export const BASE64 = RegExp_Base64;
    export const SKILL_GROUP_CODE = RegExp_Skill_Group_Code;
  }
}

export default SkillGroupRegexes;
