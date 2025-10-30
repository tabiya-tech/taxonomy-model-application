// ISCO Group code regex
export const RegExp_Str_ISCO_Group_Code = `^\\d{1,4}$`;
export const RegExp_ISCO_Group_Code = new RegExp(RegExp_Str_ISCO_Group_Code);
// Local group code regex
export const RegExp_Str_Local_Group_Code = `^(?:\\d{1,4})?[a-zA-Z]+[a-zA-Z\\d]*$`;
export const RegExp_Local_Group_Code = new RegExp(RegExp_Str_Local_Group_Code);
// ESCO Occupation code regex
export const RegExp_Str_ESCO_Occupation_Code = `^\\d{4}(?:\\.\\d+)+$`;
export const RegExp_ESCO_Occupation_Code = new RegExp(RegExp_Str_ESCO_Occupation_Code);
// ESCO Local occupation code regex
export const RegExp_Str_ESCO_Local_Occupation_Code = `^\\d{4}(?:\\.\\d+)*(?:_\\d+)+$`;
export const RegExp_ESCO_Local_Occupation_Code = new RegExp(RegExp_Str_ESCO_Local_Occupation_Code);
// Local Occupation code regex
export const RegExp_Str_Local_Occupation_Code = `(^[a-zA-Z\\d]+)(?:_\\d+)+$`;
export const RegExp_Local_Occupation_Code = new RegExp(RegExp_Str_Local_Occupation_Code);
// ESCO Local or Local occupation code regex
export const RegExp_Str_ESCO_Local_Or_Local_Occupation_Code = `^(?:\\d{4}(?:\\.\\d+)*(?:_\\d+)+|[a-zA-Z\\d]+(?:_\\d+)+)$`;
export const RegExp_ESCO_Local_Or_Local_Occupation_Code = new RegExp(RegExp_Str_ESCO_Local_Or_Local_Occupation_Code);
// Skill Group code regex
export const RegExp_Str_Skill_Group_Code = `^([a-zA-Z]\\d+(\\.\\d+)*|[a-zA-Z])$`;
export const RegExp_Skill_Group_Code = new RegExp(RegExp_Str_Skill_Group_Code);
