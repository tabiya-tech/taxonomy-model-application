import * as Import from "api-specifications/import";

export const mapFileTypeToName = (fileType: Import.Types.ImportFileTypes): string => {
  switch (fileType) {
    case Import.Types.ImportFileTypes.ESCO_OCCUPATION:
      return "ESCO Occupations";
    case Import.Types.ImportFileTypes.ESCO_SKILL_HIERARCHY:
      return "Skill Hierarchy";
    case Import.Types.ImportFileTypes.ESCO_SKILL:
      return "Skills";
    case Import.Types.ImportFileTypes.ESCO_SKILL_GROUP:
      return "Skill Groups";
    case Import.Types.ImportFileTypes.ESCO_SKILL_SKILL_RELATIONS :
      return "ESCO Skill-To-Skill Relations";
    case Import.Types.ImportFileTypes.ISCO_GROUP:
      return "ISCO Groups";
    case Import.Types.ImportFileTypes.LOCAL_OCCUPATION:
      return "Local Occupations";
    case Import.Types.ImportFileTypes.LOCALIZED_OCCUPATION:
      return "Localized Occupations";
    case Import.Types.ImportFileTypes.MODEL_INFO:
      return  "Model Info";
    case Import.Types.ImportFileTypes.OCCUPATION_HIERARCHY:
      return "Occupation Hierarchy";
    case Import.Types.ImportFileTypes.OCCUPATION_LOGS:
      return "Occupation Logs";
    case Import.Types.ImportFileTypes.OCCUPATION_LOG_CHANGES:
      return "Occupation Log Changes";
    case Import.Types.ImportFileTypes.OCCUPATION_SKILL_RELATION:
      return "Occupation-To-Skill Relations";
    default:
      return "Unknown File Type";
  }
}