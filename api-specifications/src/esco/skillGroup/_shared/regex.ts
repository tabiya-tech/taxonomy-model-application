import { RegExp_Base64, RegExp_Str_Base64 } from "../../../regex";
import {
  RegExp_Str_Skill_Group_Code,
  RegExp_Skill_Group_Code,
  RegExp_Children_Ids,
  RegExp_Str_Children_Ids,
} from "../../common/regex";

namespace SkillGroupRegexes {
  export namespace Str {
    export const BASE64 = RegExp_Str_Base64;
    export const SKILL_GROUP_CODE = RegExp_Str_Skill_Group_Code;
    export const CHILDREN_IDS = RegExp_Str_Children_Ids;
  }
  export namespace RegExp {
    export const BASE64 = RegExp_Base64;
    export const SKILL_GROUP_CODE = RegExp_Skill_Group_Code;
    export const CHILDREN_IDS = RegExp_Children_Ids;
  }
}

export default SkillGroupRegexes;
