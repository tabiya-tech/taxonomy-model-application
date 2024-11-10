import { ObjectTypes } from "./objectTypes";
import {
  CSVObjectTypes,
  CSVRelationType,
  CSVReuseLevel,
  CSVSignallingValueLabel,
  CSVSkillType,
} from "./csvObjectTypes";
import { ReuseLevel, SkillType } from "esco/skill/skills.types";
import { SkillToSkillRelationType } from "esco/skillToSkillRelation/skillToSkillRelation.types";
import { OccupationToSkillRelationType } from "esco/occupationToSkillRelation/occupationToSkillRelation.types";

const HEADER_NAMES = {
  ID: "ID",
  UUIDHISTORY: "UUIDHISTORY",
  ORIGINURI: "ORIGINURI",
  PREFERREDLABEL: "PREFERREDLABEL",
  ALTLABELS: "ALTLABELS",
  DESCRIPTION: "DESCRIPTION",
  ISLOCALIZED: "ISLOCALIZED",
  UPDATED_AT: "UPDATEDAT",
  CREATED_AT: "CREATEDAT",
};
/*
 * ----------------------------- *
 * This pair of interface and headers should be a 1 to 1 mapping
 * Otherwise we introduce inconsistencies in import and export mapping
 */

/*
 * Headers for the occupationGroup CSV file
 */

export const OccupationGroupImportHeaders = [
  HEADER_NAMES.ID,
  HEADER_NAMES.ORIGINURI,
  HEADER_NAMES.UUIDHISTORY,
  "CODE",
  "GROUPTYPE",
  HEADER_NAMES.PREFERREDLABEL,
  HEADER_NAMES.ALTLABELS,
  HEADER_NAMES.DESCRIPTION,
];

export const OccupationGroupExportHeaders = [
  ...OccupationGroupImportHeaders,
  HEADER_NAMES.CREATED_AT,
  HEADER_NAMES.UPDATED_AT,
];

/*
 * Interface for the occupationGroup row in the CSV file
 */
export interface IOccupationGroupImportRow {
  ID: string;
  ORIGINURI: string;
  UUIDHISTORY: string;
  CODE: string;
  PREFERREDLABEL: string;
  ALTLABELS: string;
  DESCRIPTION: string;
  GROUPTYPE: CSVObjectTypes.ISCOGroup | CSVObjectTypes.LocalGroup;
}

export interface IOccupationGroupExportRow extends IOccupationGroupImportRow {
  CREATEDAT: string;
  UPDATEDAT: string;
}

/*
 * Headers for the skill CSV file
 */
export const skillImportHeaders = [
  HEADER_NAMES.ID,
  HEADER_NAMES.ORIGINURI,
  HEADER_NAMES.UUIDHISTORY,
  "DEFINITION",
  "SCOPENOTE",
  "REUSELEVEL",
  "SKILLTYPE",
  HEADER_NAMES.PREFERREDLABEL,
  HEADER_NAMES.ALTLABELS,
  HEADER_NAMES.DESCRIPTION,
  HEADER_NAMES.ISLOCALIZED,
];

export const skillExportHeaders = [
  ...skillImportHeaders,
  "DEGREECENTRALITY",
  "INTEROCCUPATIONTRANSFERABILITY",
  "UNSEENTOSEENTRANSFERABILITY",
  HEADER_NAMES.CREATED_AT,
  HEADER_NAMES.UPDATED_AT,
];

/*
 * Interface for the skill row in the CSV file
 */
export interface ISkillImportRow {
  ID: string;
  ORIGINURI: string;
  UUIDHISTORY: string;
  PREFERREDLABEL: string;
  ALTLABELS: string;
  DESCRIPTION: string;
  DEFINITION: string;
  SCOPENOTE: string;
  REUSELEVEL: ReuseLevel;
  SKILLTYPE: SkillType;
  ISLOCALIZED: string;
}

export interface ISkillExportRow {
  ID: string;
  ORIGINURI: string;
  UUIDHISTORY: string;
  PREFERREDLABEL: string;
  ALTLABELS: string;
  DESCRIPTION: string;
  DEFINITION: string;
  SCOPENOTE: string;
  REUSELEVEL: CSVReuseLevel;
  SKILLTYPE: CSVSkillType;
  CREATEDAT: string;
  UPDATEDAT: string;
  DEGREECENTRALITY: string;
  INTEROCCUPATIONTRANSFERABILITY: string;
  UNSEENTOSEENTRANSFERABILITY: string;
  ISLOCALIZED: string;
}

/*
 * Headers for the skillGroup CSV file
 */
export const skillGroupImportHeaders = [
  HEADER_NAMES.ID,
  HEADER_NAMES.ORIGINURI,
  HEADER_NAMES.UUIDHISTORY,
  "CODE",
  "SCOPENOTE",
  HEADER_NAMES.PREFERREDLABEL,
  HEADER_NAMES.ALTLABELS,
  HEADER_NAMES.DESCRIPTION,
];

export const skillGroupExportHeaders = [...skillGroupImportHeaders, HEADER_NAMES.CREATED_AT, HEADER_NAMES.UPDATED_AT];

/*
 * Interface for the skillGroup row in the CSV file
 */

export interface ISkillGroupImportRow {
  ID: string;
  ORIGINURI: string;
  UUIDHISTORY: string;
  CODE: string;
  PREFERREDLABEL: string;
  ALTLABELS: string;
  DESCRIPTION: string;
  SCOPENOTE: string;
}

export interface ISkillGroupExportRow extends ISkillGroupImportRow {
  CREATEDAT: string;
  UPDATEDAT: string;
}

/*
 * Headers for the occupations CSV file
 */

export const occupationImportHeaders = [
  HEADER_NAMES.ID,
  HEADER_NAMES.ORIGINURI,
  HEADER_NAMES.UUIDHISTORY,
  "OCCUPATIONGROUPCODE",
  "CODE",
  "DEFINITION",
  "SCOPENOTE",
  "REGULATEDPROFESSIONNOTE",
  "OCCUPATIONTYPE",
  HEADER_NAMES.ISLOCALIZED,
  HEADER_NAMES.PREFERREDLABEL,
  HEADER_NAMES.ALTLABELS,
  HEADER_NAMES.DESCRIPTION,
];

export const occupationExportHeaders = [...occupationImportHeaders, HEADER_NAMES.CREATED_AT, HEADER_NAMES.UPDATED_AT];

/*
 * Interface for the occupations row in the CSV file
 */

export interface IOccupationImportRow {
  ID: string;
  ORIGINURI: string;
  UUIDHISTORY: string;
  OCCUPATIONGROUPCODE: string;
  CODE: string;
  PREFERREDLABEL: string;
  ALTLABELS: string;
  DESCRIPTION: string;
  DEFINITION: string;
  SCOPENOTE: string;
  REGULATEDPROFESSIONNOTE: string;
  ISLOCALIZED: string;
  OCCUPATIONTYPE: CSVObjectTypes.ESCOOccupation | CSVObjectTypes.LocalOccupation;
}

export interface IOccupationExportRow {
  ID: string;
  ORIGINURI: string;
  UUIDHISTORY: string;
  OCCUPATIONGROUPCODE: string;
  CODE: string;
  PREFERREDLABEL: string;
  ALTLABELS: string;
  DESCRIPTION: string;
  DEFINITION: string;
  SCOPENOTE: string;
  REGULATEDPROFESSIONNOTE: string;
  OCCUPATIONTYPE: CSVObjectTypes.ESCOOccupation | CSVObjectTypes.LocalOccupation;
  ISLOCALIZED: string;
  CREATEDAT: string;
  UPDATEDAT: string;
}

/*
 * Headers for the for skill-to-skill relation CSV file
 */

export const skillToSkillRelationImportHeaders = ["REQUIRINGID", "RELATIONTYPE", "REQUIREDID"];

export const skillToSkillRelationExportHeaders = [
  ...skillToSkillRelationImportHeaders,
  HEADER_NAMES.CREATED_AT,
  HEADER_NAMES.UPDATED_AT,
];

/*
 * Interface for the skill-to-skill row in the CSV file
 */

export interface ISkillToSkillsRelationImportRow {
  REQUIRINGID: string;
  RELATIONTYPE: SkillToSkillRelationType;
  REQUIREDID: string;
}

export interface ISkillToSkillsRelationExportRow {
  REQUIRINGID: string;
  RELATIONTYPE: CSVRelationType;
  REQUIREDID: string;
  CREATEDAT: string;
  UPDATEDAT: string;
}

/*
 * Headers for the for occupation-to-skill relation CSV file
 */

export const occupationToSkillRelationImportHeaders = [
  "OCCUPATIONTYPE",
  "OCCUPATIONID",
  "RELATIONTYPE",
  "SKILLID",
  "SIGNALLINGVALUELABEL",
  "SIGNALLINGVALUE",
];

export const occupationToSkillRelationExportHeaders = [
  ...occupationToSkillRelationImportHeaders,
  HEADER_NAMES.CREATED_AT,
  HEADER_NAMES.UPDATED_AT,
];

/*
 * Interface for the occupation-to-skill row in the CSV file
 */

export interface IOccupationToSkillRelationImportRow {
  OCCUPATIONTYPE: ObjectTypes.ESCOOccupation | ObjectTypes.LocalOccupation;
  OCCUPATIONID: string;
  RELATIONTYPE: OccupationToSkillRelationType;
  SKILLID: string;
  SIGNALLINGVALUELABEL: CSVSignallingValueLabel;
  SIGNALLINGVALUE: string;
}

export interface IOccupationToSkillRelationExportRow {
  OCCUPATIONTYPE: CSVObjectTypes.ESCOOccupation | CSVObjectTypes.LocalOccupation;
  OCCUPATIONID: string;
  RELATIONTYPE: CSVRelationType;
  SKILLID: string;
  CREATEDAT: string;
  SIGNALLINGVALUELABEL: CSVSignallingValueLabel;
  SIGNALLINGVALUE: string;
  UPDATEDAT: string;
}

/*
 * Headers for the for occupationHierarchy CSV file
 */

export const occupationHierarchyImportHeaders = ["PARENTOBJECTTYPE", "PARENTID", "CHILDID", "CHILDOBJECTTYPE"];

export const occupationHierarchyExportHeaders = [
  ...occupationHierarchyImportHeaders,
  HEADER_NAMES.CREATED_AT,
  HEADER_NAMES.UPDATED_AT,
];

/*
 * Interface for the occupationHierarchy row in the CSV file
 */

export interface IOccupationHierarchyImportRow {
  PARENTOBJECTTYPE:
    | ObjectTypes.ISCOGroup
    | ObjectTypes.LocalGroup
    | ObjectTypes.ESCOOccupation
    | ObjectTypes.LocalOccupation;
  PARENTID: string;
  CHILDID: string;
  CHILDOBJECTTYPE:
    | ObjectTypes.ISCOGroup
    | ObjectTypes.LocalGroup
    | ObjectTypes.ESCOOccupation
    | ObjectTypes.LocalOccupation;
}

export interface IOccupationHierarchyExportRow {
  PARENTOBJECTTYPE:
    | CSVObjectTypes.ISCOGroup
    | CSVObjectTypes.LocalGroup
    | CSVObjectTypes.ESCOOccupation
    | CSVObjectTypes.LocalOccupation;
  PARENTID: string;
  CHILDID: string;
  CHILDOBJECTTYPE:
    | CSVObjectTypes.ISCOGroup
    | CSVObjectTypes.LocalGroup
    | CSVObjectTypes.ESCOOccupation
    | CSVObjectTypes.LocalOccupation;
  CREATEDAT: string;
  UPDATEDAT: string;
}

/*
 * Headers for the for skillHierarchy CSV file
 */

export const skillHierarchyImportHeaders = ["PARENTOBJECTTYPE", "PARENTID", "CHILDID", "CHILDOBJECTTYPE"];

export const skillHierarchyExportHeaders = [
  ...skillHierarchyImportHeaders,
  HEADER_NAMES.CREATED_AT,
  HEADER_NAMES.UPDATED_AT,
];

/*
 * Interface for the skillHierarchy row in the CSV file
 */

export interface ISkillHierarchyImportRow {
  PARENTOBJECTTYPE: ObjectTypes.Skill | ObjectTypes.SkillGroup;
  PARENTID: string;
  CHILDID: string;
  CHILDOBJECTTYPE: ObjectTypes.Skill | ObjectTypes.SkillGroup;
}

export interface ISkillHierarchyExportRow {
  PARENTOBJECTTYPE: CSVObjectTypes.Skill | CSVObjectTypes.SkillGroup;
  PARENTID: string;
  CHILDID: string;
  CHILDOBJECTTYPE: CSVObjectTypes.Skill | CSVObjectTypes.SkillGroup;
  CREATEDAT: string;
  UPDATEDAT: string;
}

/*
 * ----------------------------- *
 */
