namespace ImportConstants {
  export const MAX_PAYLOAD_LENGTH = 4000; // chars

  export const FILEPATH_MAX_LENGTH = 255;

  export enum ImportFileTypes { //enum is not a type, but not having it in this namespace causes import issues down the line
    ISCO_GROUPS = "ISCO_GROUPS", //<--- isco_groups.csv
    OCCUPATIONS = "OCCUPATIONS", // <-- occupations.csv
    ESCO_SKILL_GROUPS = "ESCO_SKILL_GROUPS", // <-- skill_groups.csv
    ESCO_SKILLS = "ESCO_SKILLS", //<--- skills.csv
    OCCUPATION_HIERARCHY = "OCCUPATION_HIERARCHY", // <--- occupation_hierarchy.csv
    ESCO_SKILL_HIERARCHY = "ESCO_SKILL_HIERARCHY", // <--- skill_hierarchy.csv
    ESCO_SKILL_SKILL_RELATIONS = "ESCO_SKILL_SKILL_RELATIONS", // <--- skillSkillRelations.csv
    OCCUPATION_SKILL_RELATIONS = "OCCUPATION_SKILL_RELATIONS", // <--- occupation_to_skill_relations.csv
    // OCCUPATION_LOGS = "OCCUPATION_LOGS",
    // OCCUPATION_LOG_CHANGES = "OCCUPATION_LOG_CHANGES",
  }
}

export default ImportConstants;
