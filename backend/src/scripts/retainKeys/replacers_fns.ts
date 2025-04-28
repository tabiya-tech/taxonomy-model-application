import {
  IOccupationHierarchyExportRow,
  IOccupationToSkillRelationExportRow,
  ISkillHierarchyExportRow,
  ISkillToSkillsRelationExportRow,
} from "esco/common/entityToCSV.types";
import { CSVObjectTypes } from "esco/common/csvObjectTypes";
import { RecordType } from "./types";

export function genericReplace(exportedRecords: RecordType[], keysMap: RecordType, fieldToReplace: string): void {
  if (exportedRecords.length !== Object.keys(keysMap).length) {
    throw new Error("The lengths of exportedRecords and keysMap must match.");
  }

  for (const exportedRecord of exportedRecords) {
    const currentValue = exportedRecord[fieldToReplace];
    if (currentValue in keysMap) {
      exportedRecord[fieldToReplace] = keysMap[currentValue];
    }
  }
}

export function replaceSkillHierarchy(
  exportedSkillHierarchy: ISkillHierarchyExportRow[],
  skillsGroupsKeysMap: RecordType,
  skillsKeyMap: RecordType
): void {
  for (const record of exportedSkillHierarchy) {
    if (record.PARENTOBJECTTYPE === CSVObjectTypes.SkillGroup) {
      record.PARENTID = skillsGroupsKeysMap[record.PARENTID];
    }

    if (record.PARENTOBJECTTYPE === CSVObjectTypes.Skill) {
      record.PARENTID = skillsKeyMap[record.PARENTID];
    }

    if (record.CHILDOBJECTTYPE === CSVObjectTypes.SkillGroup) {
      record.CHILDID = skillsGroupsKeysMap[record.CHILDID];
    }

    if (record.CHILDOBJECTTYPE === CSVObjectTypes.Skill) {
      record.CHILDID = skillsKeyMap[record.CHILDID];
    }
  }
}

export function replaceSkillToSkillRelations(
  exportedSkillToSkillRelations: ISkillToSkillsRelationExportRow[],
  skillsKeyMap: RecordType
): void {
  for (const record of exportedSkillToSkillRelations) {
    record.REQUIRINGID = skillsKeyMap[record.REQUIRINGID];
    record.REQUIREDID = skillsKeyMap[record.REQUIREDID];
  }
}

export function replaceOccupationHierarchy(
  exportedOccupationHierarchy: IOccupationHierarchyExportRow[],
  occupationGroupsKeysMap: RecordType,
  occupationsKeyMap: RecordType
): void {
  for (const record of exportedOccupationHierarchy) {
    switch (record.PARENTOBJECTTYPE) {
      case CSVObjectTypes.ESCOOccupation:
      case CSVObjectTypes.LocalOccupation:
        record.PARENTID = occupationsKeyMap[record.PARENTID];
        break;
      case CSVObjectTypes.ISCOGroup:
      case CSVObjectTypes.LocalGroup:
        record.PARENTID = occupationGroupsKeysMap[record.PARENTID];
        break;
    }

    switch (record.CHILDOBJECTTYPE) {
      case CSVObjectTypes.ESCOOccupation:
      case CSVObjectTypes.LocalOccupation:
        record.CHILDID = occupationsKeyMap[record.CHILDID];
        break;
      case CSVObjectTypes.ISCOGroup:
      case CSVObjectTypes.LocalGroup:
        record.CHILDID = occupationGroupsKeysMap[record.CHILDID];
        break;
    }
  }
}

export function replaceOccupationToSkillRelations(
  exportedOccupationToSkillRelations: IOccupationToSkillRelationExportRow[],
  occupationsKeyMap: RecordType,
  skillsKeyMap: RecordType
): void {
  for (const record of exportedOccupationToSkillRelations) {
    record.OCCUPATIONID = occupationsKeyMap[record.OCCUPATIONID];
    record.SKILLID = skillsKeyMap[record.SKILLID];
  }
}
