import path from "path";
import { readCSV, writeCSV, constructKeysMap } from "./utils";
import {
  genericReplace,
  replaceSkillToSkillRelations,
  replaceSkillHierarchy,
  replaceOccupationHierarchy,
  replaceOccupationToSkillRelations,
} from "./replacers_fns";
import {
  IOccupationExportRow,
  IOccupationGroupExportRow,
  IOccupationGroupImportRow,
  IOccupationHierarchyExportRow,
  IOccupationHierarchyImportRow,
  IOccupationImportRow,
  IOccupationToSkillRelationExportRow,
  IOccupationToSkillRelationImportRow, ISkillExportRow, ISkillGroupExportRow, ISkillGroupImportRow,
  ISkillHierarchyExportRow,
  ISkillHierarchyImportRow, ISkillImportRow,
  ISkillToSkillsRelationExportRow,
  ISkillToSkillsRelationImportRow,
} from "esco/common/entityToCSV.types";
import { assertModelsAreEqual } from "./assertions";

interface ReplaceIdsParams {
  exportedModelPath: string;
  referenceModalPath: string;
  destinationPath: string;
}

async function retainKeys({ exportedModelPath, referenceModalPath, destinationPath }: ReplaceIdsParams): Promise<void> {
  // ================= Model Info =================
  const referenceModelInfo = await readCSV(path.join(referenceModalPath, "model_info.csv"));
  const exportedModelInfo = await readCSV(path.join(exportedModelPath, "model_info.csv"));
  await writeCSV(path.join(destinationPath, "model_info.csv"), exportedModelInfo.rows, referenceModelInfo.fieldNames);

  // ================= Occupations =================
  const referenceOccupations = await readCSV<IOccupationImportRow>(path.join(referenceModalPath, "occupations.csv"));
  const exportedOccupations = await readCSV<IOccupationExportRow>(path.join(exportedModelPath, "occupations.csv"));
  const occupationsKeysMap = constructKeysMap(referenceOccupations.rows, exportedOccupations.rows, "CODE");

  genericReplace(exportedOccupations.rows, occupationsKeysMap, "ID");
  await writeCSV(path.join(destinationPath, "occupations.csv"), exportedOccupations.rows, referenceOccupations.fieldNames);

  // ================= Occupation Groups =================
  const referenceOccupationGroups = await readCSV<IOccupationGroupImportRow>(
    path.join(referenceModalPath, "occupation_groups.csv")
  );
  const exportedOccupationGroups = await readCSV<IOccupationGroupExportRow>(
    path.join(exportedModelPath, "occupation_groups.csv")
  );
  const occupationGroupsKeysMap = constructKeysMap(
    referenceOccupationGroups.rows,
    exportedOccupationGroups.rows,
    "CODE"
  );

  genericReplace(exportedOccupationGroups.rows, occupationGroupsKeysMap, "ID");
  await writeCSV(
    path.join(destinationPath, "occupation_groups.csv"),
    exportedOccupationGroups.rows,
    referenceOccupationGroups.fieldNames
  );

  // ================= Skills =================
  const referenceSkills = await readCSV<ISkillImportRow>(path.join(referenceModalPath, "skills.csv"));
  const exportedSkills = await readCSV<ISkillExportRow>(path.join(exportedModelPath, "skills.csv"));
  const skillsKeysMap = constructKeysMap(referenceSkills.rows, exportedSkills.rows, "ORIGINURI");

  genericReplace(exportedSkills.rows, skillsKeysMap, "ID");
  await writeCSV(path.join(destinationPath, "skills.csv"), exportedSkills.rows, referenceSkills.fieldNames);

  // ================= Skill Groups =================
  const referenceSkillGroups = await readCSV<ISkillGroupImportRow>(path.join(referenceModalPath, "skill_groups.csv"));
  const exportedSkillGroups = await readCSV<ISkillGroupExportRow>(path.join(exportedModelPath, "skill_groups.csv"));
  const skillGroupsKeysMap = constructKeysMap(referenceSkillGroups.rows, exportedSkillGroups.rows, "ORIGINURI");

  genericReplace(exportedSkillGroups.rows, skillGroupsKeysMap, "ID");
  await writeCSV(path.join(destinationPath, "skill_groups.csv"), exportedSkillGroups.rows, referenceSkillGroups.fieldNames);

  // ================= Skill to Skill Relations =================
  const referenceSkillToSkill = await readCSV<ISkillToSkillsRelationImportRow>(
    path.join(referenceModalPath, "skill_to_skill_relations.csv")
  );
  const exportedSkillToSkill = await readCSV<ISkillToSkillsRelationExportRow>(
    path.join(exportedModelPath, "skill_to_skill_relations.csv")
  );
  replaceSkillToSkillRelations(exportedSkillToSkill.rows, skillsKeysMap);

  await writeCSV(
    path.join(destinationPath, "skill_to_skill_relations.csv"),
    exportedSkillToSkill.rows,
    referenceSkillToSkill.fieldNames
  );

  // ================= Skill Hierarchy =================
  const referenceSkillHierarchy = await readCSV<ISkillHierarchyImportRow>(
    path.join(referenceModalPath, "skill_hierarchy.csv")
  );
  const exportedSkillHierarchy = await readCSV<ISkillHierarchyExportRow>(
    path.join(exportedModelPath, "skill_hierarchy.csv")
  );
  replaceSkillHierarchy(exportedSkillHierarchy.rows, skillGroupsKeysMap, skillsKeysMap);

  await writeCSV(
    path.join(destinationPath, "skill_hierarchy.csv"),
    exportedSkillHierarchy.rows,
    referenceSkillHierarchy.fieldNames
  );

  // ================= Occupation Hierarchy =================
  const referenceOccupationHierarchy = await readCSV<IOccupationHierarchyImportRow>(
    path.join(referenceModalPath, "occupation_hierarchy.csv")
  );
  const exportedOccupationHierarchy = await readCSV<IOccupationHierarchyExportRow>(
    path.join(exportedModelPath, "occupation_hierarchy.csv")
  );
  replaceOccupationHierarchy(exportedOccupationHierarchy.rows, occupationGroupsKeysMap, occupationsKeysMap);

  await writeCSV(
    path.join(destinationPath, "occupation_hierarchy.csv"),
    exportedOccupationHierarchy.rows,
    referenceOccupationHierarchy.fieldNames
  );

  // ================= Occupation to Skill Relations =================
  const referenceOccupationToSkill = await readCSV<IOccupationToSkillRelationImportRow>(
    path.join(referenceModalPath, "occupation_to_skill_relations.csv")
  );
  const exportedOccupationToSkill = await readCSV<IOccupationToSkillRelationExportRow>(
    path.join(exportedModelPath, "occupation_to_skill_relations.csv")
  );
  replaceOccupationToSkillRelations(exportedOccupationToSkill.rows, occupationsKeysMap, skillsKeysMap);

  await writeCSV(
    path.join(destinationPath, "occupation_to_skill_relations.csv"),
    exportedOccupationToSkill.rows,
    referenceOccupationToSkill.fieldNames
  );

  // Assertions.
  assertModelsAreEqual({
    modelPath1: exportedModelPath,
    modelPath2: destinationPath,
  });
}

retainKeys({
  exportedModelPath: "/path/to/exported/model",

  referenceModalPath: "/path/to/source/model",
  destinationPath: "/path/to/destination/model",
}).catch((err) => {
  console.error("Error:", err);
});
