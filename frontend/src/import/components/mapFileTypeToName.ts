import ImportAPISpecs from "api-specifications/import";

export const mapFileTypeToName = (fileType: ImportAPISpecs.Constants.ImportFileTypes): string => {
  switch (fileType) {
    case ImportAPISpecs.Constants.ImportFileTypes.ESCO_OCCUPATION:
      return "ESCO Occupations";
    case ImportAPISpecs.Constants.ImportFileTypes.ESCO_SKILL_HIERARCHY:
      return "Skill Hierarchy";
    case ImportAPISpecs.Constants.ImportFileTypes.ESCO_SKILL:
      return "Skills";
    case ImportAPISpecs.Constants.ImportFileTypes.ESCO_SKILL_GROUP:
      return "Skill Groups";
    case ImportAPISpecs.Constants.ImportFileTypes.ESCO_SKILL_SKILL_RELATIONS :
      return "ESCO Skill-To-Skill Relations";
    case ImportAPISpecs.Constants.ImportFileTypes.ISCO_GROUP:
      return "ISCO Groups";
    case ImportAPISpecs.Constants.ImportFileTypes.LOCAL_OCCUPATION:
      return "Local Occupations";
    case ImportAPISpecs.Constants.ImportFileTypes.LOCALIZED_OCCUPATION:
      return "Localized Occupations";
    case ImportAPISpecs.Constants.ImportFileTypes.MODEL_INFO:
      return  "Model Info";
    case ImportAPISpecs.Constants.ImportFileTypes.OCCUPATION_HIERARCHY:
      return "Occupation Hierarchy";
    case ImportAPISpecs.Constants.ImportFileTypes.OCCUPATION_LOGS:
      return "Occupation Logs";
    case ImportAPISpecs.Constants.ImportFileTypes.OCCUPATION_LOG_CHANGES:
      return "Occupation Log Changes";
    case ImportAPISpecs.Constants.ImportFileTypes.OCCUPATION_SKILL_RELATION:
      return "Occupation-To-Skill Relations";
    default:
      return "Unknown File Type";
  }
}