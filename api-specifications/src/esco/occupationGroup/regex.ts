import { RegExp_Base64, RegExp_Str_Base64 } from "../../regex";
import {
  RegExp_ESCO_Local_Occupation_Code,
  RegExp_ESCO_Local_Or_Local_Occupation_Code,
  RegExp_ESCO_Occupation_Code,
  RegExp_ISCO_Group_Code,
  RegExp_Local_Group_Code,
  RegExp_Local_Occupation_Code,
  RegExp_Str_ESCO_Local_Occupation_Code,
  RegExp_Str_ESCO_Local_Or_Local_Occupation_Code,
  RegExp_Str_ESCO_Occupation_Code,
  RegExp_Str_ISCO_Group_Code,
  RegExp_Str_Local_Group_Code,
  RegExp_Str_Local_Occupation_Code,
} from "../common/regex";

namespace OccupationGroupRegexes {
  export namespace Str {
    export const BASE64 = RegExp_Str_Base64;
    export const ISCO_GROUP_CODE = RegExp_Str_ISCO_Group_Code;
    export const LOCAL_GROUP_CODE = RegExp_Str_Local_Group_Code;
    export const ESCO_OCCUPATION_CODE = RegExp_Str_ESCO_Occupation_Code;
    export const ESCO_LOCAL_OCCUPATION_CODE = RegExp_Str_ESCO_Local_Occupation_Code;
    export const LOCAL_OCCUPATION_CODE = RegExp_Str_Local_Occupation_Code;
    export const ESCO_LOCAL_OR_LOCAL_OCCUPATION_CODE = RegExp_Str_ESCO_Local_Or_Local_Occupation_Code;
  }
  export namespace RegExp {
    export const BASE64 = RegExp_Base64;
    export const ISCO_GROUP_CODE = RegExp_ISCO_Group_Code;
    export const LOCAL_GROUP_CODE = RegExp_Local_Group_Code;
    export const ESCO_OCCUPATION_CODE = RegExp_ESCO_Occupation_Code;
    export const ESCO_LOCAL_OCCUPATION_CODE = RegExp_ESCO_Local_Occupation_Code;
    export const LOCAL_OCCUPATION_CODE = RegExp_Local_Occupation_Code;
    export const ESCO_LOCAL_OR_LOCAL_OCCUPATION_CODE = RegExp_ESCO_Local_Or_Local_Occupation_Code;
  }
}

export default OccupationGroupRegexes;
