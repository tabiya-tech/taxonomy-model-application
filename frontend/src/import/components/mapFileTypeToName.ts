import {Constants as ImportConstants} from "api-specifications/import";

export const mapFileTypeToName = (fileType: ImportConstants.ImportFileTypes): string => {
  switch (fileType) {
    case ImportConstants.ImportFileTypes.ESCO_OCCUPATION:
      return "ESCO Occupations";
    case ImportConstants.ImportFileTypes.ESCO_SKILL_HIERARCHY:
      return "Skill Hierarchy";
    case ImportConstants.ImportFileTypes.ESCO_SKILL:
      return "Skills";
    case ImportConstants.ImportFileTypes.ESCO_SKILL_GROUP:
      return "Skill Groups";
    case ImportConstants.ImportFileTypes.ESCO_SKILL_SKILL_RELATIONS :
      return "ESCO Skill-To-Skill Relations";
    case ImportConstants.ImportFileTypes.ISCO_GROUP:
      return "ISCO Groups";
    case ImportConstants.ImportFileTypes.LOCAL_OCCUPATION:
      return "Local Occupations";
    case ImportConstants.ImportFileTypes.LOCALIZED_OCCUPATION:
      return "Localized Occupations";
    case ImportConstants.ImportFileTypes.MODEL_INFO:
      return  "Model Info";
    case ImportConstants.ImportFileTypes.OCCUPATION_HIERARCHY:
      return "Occupation Hierarchy";
    case ImportConstants.ImportFileTypes.OCCUPATION_LOGS:
      return "Occupation Logs";
    case ImportConstants.ImportFileTypes.OCCUPATION_LOG_CHANGES:
      return "Occupation Log Changes";
    case ImportConstants.ImportFileTypes.OCCUPATION_SKILL_RELATION:
      return "Occupation-To-Skill Relations";
    default:
      return "Unknown File Type";
  }
}