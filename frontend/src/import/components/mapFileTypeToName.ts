import ImportAPISpecs from "api-specifications/import";

export const mapFileTypeToName = (fileType: ImportAPISpecs.Constants.ImportFileTypes): string => {
  switch (fileType) {
    case ImportAPISpecs.Constants.ImportFileTypes.ISCO_GROUPS:
      return "ISCO Groups";
    case ImportAPISpecs.Constants.ImportFileTypes.OCCUPATIONS:
      return "Occupations";
    case ImportAPISpecs.Constants.ImportFileTypes.ESCO_SKILLS:
      return "Skills";
    case ImportAPISpecs.Constants.ImportFileTypes.ESCO_SKILL_GROUPS:
      return "Skill Groups";
    case ImportAPISpecs.Constants.ImportFileTypes.ESCO_SKILL_SKILL_RELATIONS:
      return "Skill-To-Skill Relations";
    case ImportAPISpecs.Constants.ImportFileTypes.OCCUPATION_HIERARCHY:
      return "Occupation Hierarchy";
    case ImportAPISpecs.Constants.ImportFileTypes.ESCO_SKILL_HIERARCHY:
      return "Skill Hierarchy";
    case ImportAPISpecs.Constants.ImportFileTypes.OCCUPATION_SKILL_RELATIONS:
      return "Occupation-To-Skill Relations";
    // case ImportAPISpecs.Constants.ImportFileTypes.OCCUPATION_LOGS:
    //   return "Occupation Logs";
    // case ImportAPISpecs.Constants.ImportFileTypes.OCCUPATION_LOG_CHANGES:
    //   return "Occupation Log Changes";
    default:
      return "Unknown File Type";
  }
};
