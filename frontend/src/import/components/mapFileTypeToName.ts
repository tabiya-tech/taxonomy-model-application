import {ImportFileTypes} from "api-specifications/import";

export const mapFileTypeToName = (fileType: ImportFileTypes) => {
  switch (fileType) {
    case ImportFileTypes.ESCO_OCCUPATION:
      return "ESCO Occupations";
    case ImportFileTypes.ESCO_SKILL_HIERARCHY:
      return "Skill Hierarchy";
    case ImportFileTypes.ESCO_SKILL:
      return "Skills";
    case ImportFileTypes.ESCO_SKILL_GROUP:
      return "Skill Groups";
    case    ImportFileTypes.ESCO_SKILL_SKILL_RELATIONS :
      return "ESCO Skill-To-Skill Relations";
    case  ImportFileTypes.ISCO_GROUP:
      return "ISCO Groups";
    case ImportFileTypes.LOCAL_OCCUPATION:
      return "Local Occupations";
    case ImportFileTypes.LOCALIZED_OCCUPATION:
      return "Localized Occupations";
    case ImportFileTypes.MODEL_INFO:
      return  "Model Info";
    case ImportFileTypes.OCCUPATION_HIERARCHY:
      return "Occupation Hierarchy";
    case ImportFileTypes.OCCUPATION_LOGS:
      return "Occupation Logs";
    case ImportFileTypes.OCCUPATION_LOG_CHANGES:
      return "Occupation Log Changes";
    case ImportFileTypes.OCCUPATION_SKILL_RELATION:
      return "Occupation-To-Skill Relations";
    default:
      return "Unknown File Type";
  }
}