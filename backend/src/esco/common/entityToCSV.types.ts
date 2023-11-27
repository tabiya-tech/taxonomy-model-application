import { RelationType } from "./objectTypes";

/*
 * ----------------------------- *
 * This pair of interface and headers should be a 1 to 1 mapping
 * Otherwise we introduce inconsistencies in import and export mapping
 */

/*
 * Headers for the iscoGroup CSV file
 */

export const ISCOGroupHeaders = ["ID", "ESCOURI", "ORIGINUUID", "CODE", "PREFERREDLABEL", "ALTLABELS", "DESCRIPTION"];

/*
 * Interface for the iscoGroup row in the CSV file
 */
export interface IISCOGroupRow {
  ID: string;
  ESCOURI: string;
  ORIGINUUID: string;
  CODE: string;
  PREFERREDLABEL: string;
  ALTLABELS: string;
  DESCRIPTION: string;
}

/*
 * Headers for the skill CSV file
 */
export const skillHeaders = [
  "ESCOURI",
  "ID",
  "ORIGINUUID",
  "PREFERREDLABEL",
  "ALTLABELS",
  "DESCRIPTION",
  "DEFINITION",
  "SCOPENOTE",
  "REUSELEVEL",
  "SKILLTYPE",
];

/*
 * Interface for the skill row in the CSV file
 */
export interface ISkillRow {
  ESCOURI: string;
  ORIGINUUID: string;
  PREFERREDLABEL: string;
  ALTLABELS: string;
  DESCRIPTION: string;
  DEFINITION: string;
  SCOPENOTE: string;
  REUSELEVEL: string;
  SKILLTYPE: string;
  ID: string;
}

/*
 * Headers for the skillGroup CSV file
 */
export const skillGroupHeaders = [
  "ID",
  "ESCOURI",
  "ORIGINUUID",
  "CODE",
  "PREFERREDLABEL",
  "ALTLABELS",
  "DESCRIPTION",
  "SCOPENOTE",
];

/*
 * Interface for the skillGroup row in the CSV file
 */

export interface ISkillGroupRow {
  ID: string;
  ESCOURI: string;
  ORIGINUUID: string;
  CODE: string;
  PREFERREDLABEL: string;
  ALTLABELS: string;
  DESCRIPTION: string;
  SCOPENOTE: string;
}

/*
 * Headers for the occupations CSV file
 */

export const occupationHeaders = [
  "ID",
  "ESCOURI",
  "ORIGINUUID",
  "ISCOGROUPCODE",
  "CODE",
  "PREFERREDLABEL",
  "ALTLABELS",
  "DESCRIPTION",
  "DEFINITION",
  "SCOPENOTE",
  "REGULATEDPROFESSIONNOTE",
  "OCCUPATIONTYPE",
];

/*
 * Interface for the occupations row in the CSV file
 */

export interface IOccupationRow {
  ID: string;
  ESCOURI: string;
  ORIGINUUID: string;
  ISCOGROUPCODE: string;
  CODE: string;
  PREFERREDLABEL: string;
  ALTLABELS: string;
  DESCRIPTION: string;
  DEFINITION: string;
  SCOPENOTE: string;
  REGULATEDPROFESSIONNOTE: string;
  OCCUPATIONTYPE: string;
}

/*
 * Headers for the LocalizedOccupation CSV file
 */

export const localizedOccupationHeaders = ["ID", "ALTLABELS", "DESCRIPTION", "OCCUPATIONTYPE", "LOCALIZESOCCUPATIONID"];

/*
 * Interface for the LocalizedOccupation row in the CSV file
 */
export interface ILocalizedOccupationRow {
  ID: string;
  ALTLABELS: string;
  DESCRIPTION: string;
  OCCUPATIONTYPE: string;
  LOCALIZESOCCUPATIONID: string;
}

/*
 * Headers for the for skill-to-skill relation CSV file
 */

export const skillRelationHeaders = ["REQUIRINGID", "RELATIONTYPE", "REQUIREDID"];

/*
 * Interface for the skill-to-skill row in the CSV file
 */

export interface ISkillToSkillsRelationRow {
  REQUIRINGID: string;
  RELATIONTYPE: RelationType;
  REQUIREDID: string;
}

/*
 * ----------------------------- *
 */
