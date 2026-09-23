import { ObjectTypes } from "./objectTypes";
import {
  CSVObjectTypes,
  CSVRelationType,
  CSVReuseLevel,
  CSVSignallingValueLabel,
  CSVSkillType,
} from "./csvObjectTypes";
import { ReuseLevel, SkillType } from "esco/skill/_shared/skill.types";
import { SkillToSkillRelationType } from "esco/skillToSkillRelation/skillToSkillRelation.types";
import { OccupationToSkillRelationType } from "esco/occupationToSkillRelation/occupationToSkillRelation.types";
import LanguageAPISpecs from "api-specifications/language";
import { readLanguageValue, readLanguageValues } from "common/language/translatedFields";
import { stringFromArray } from "common/parseNewLineSeparateArray/parseNewLineSeparatedArray";

/**
 * Localized column variants for each field, e.g. PREFERREDLABEL_EN, DESCRIPTION_FR.
 * Columns are optional because only the languages declared in the model's availableLanguages will be present.
 */
type LocalizedColumns<TFields extends string> = Partial<
  Record<`${TFields}_${LanguageAPISpecs.Types.LanguageCsvSuffix}`, string>
>;

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
} as const;

/*
 * Translatable fields get one column per language, e.g. PREFERREDLABEL_EN, PREFERREDLABEL_FR.
 * Suffixed even for a single language. Import headers are not suffixed yet.
 */

// e.g. PREFERREDLABEL_EN
export type LanguageSuffixedHeader<Header extends string> = `${Header}_${string}`;

// The export row shape shared by every translatable entity: one column per language per translatable header,
// plus whatever non-localizable fields (id, code, timestamps, ...) that entity carries as-is.
export type ExportRow<TranslatableHeader extends string, NonLocalizableFields> = Record<
  LanguageSuffixedHeader<TranslatableHeader>,
  string
> &
  NonLocalizableFields;

export function getLanguageSuffixedHeader<Header extends string>(
  header: Header,
  language: LanguageAPISpecs.Types.ILanguageConfig
): LanguageSuffixedHeader<Header> {
  return `${header}_${language.csvSuffix}`;
}

// Expands each translatable header into one per language, in place. Field order first, then language order.
function expandTranslatableHeaders(
  headers: readonly string[],
  translatableHeaders: readonly string[],
  languages: readonly LanguageAPISpecs.Types.ILanguageConfig[]
): string[] {
  return headers.flatMap((header) =>
    translatableHeaders.includes(header)
      ? languages.map((language) => getLanguageSuffixedHeader(header, language))
      : [header]
  );
}

// e.g. { en: "Cook" } -> { PREFERREDLABEL_EN: "Cook", PREFERREDLABEL_FR: "" }. Missing translation -> "".
export function getLanguageSuffixedColumns<Header extends string>(
  header: Header,
  translatedValue: unknown,
  languages: readonly LanguageAPISpecs.Types.ILanguageConfig[]
): Record<LanguageSuffixedHeader<Header>, string> {
  return Object.fromEntries(
    languages.map((language) => [
      getLanguageSuffixedHeader(header, language),
      readLanguageValue(translatedValue, language.dbKeyName),
    ])
  ) as Record<LanguageSuffixedHeader<Header>, string>;
}

// same as above but for a list (e.g. altLabels): one newline-joined column per language, missing entries as "".
export function getLanguageSuffixedArrayColumns<Header extends string>(
  header: Header,
  translatedValues: unknown,
  languages: readonly LanguageAPISpecs.Types.ILanguageConfig[]
): Record<LanguageSuffixedHeader<Header>, string> {
  return Object.fromEntries(
    languages.map((language) => [
      getLanguageSuffixedHeader(header, language),
      stringFromArray(readLanguageValues(translatedValues, language.dbKeyName)),
    ])
  ) as Record<LanguageSuffixedHeader<Header>, string>;
}

// Builds an entity's getXExportHeaders function: every import header, translatable ones expanded per language, then the timestamps.
function makeGetExportHeaders(importHeaders: readonly string[], translatableHeaders: readonly string[]) {
  return (languages: readonly LanguageAPISpecs.Types.ILanguageConfig[]): string[] => [
    ...expandTranslatableHeaders(importHeaders, translatableHeaders, languages),
    HEADER_NAMES.CREATED_AT,
    HEADER_NAMES.UPDATED_AT,
  ];
}

type TranslatableFieldValue = unknown | unknown[];

// Spreads every translatable field of a row at once. translatedValuesByHeader must carry every header of Header, so a
// field left out is a compile error instead of a silently missing column.
export function getLanguageSuffixedRowColumns<Header extends string>(
  translatedValuesByHeader: Record<Header, TranslatableFieldValue>,
  arrayHeaders: readonly Header[],
  languages: readonly LanguageAPISpecs.Types.ILanguageConfig[]
): Record<LanguageSuffixedHeader<Header>, string> {
  const columns = {} as Record<LanguageSuffixedHeader<Header>, string>;
  (Object.keys(translatedValuesByHeader) as Header[]).forEach((header) => {
    const translatedValue = translatedValuesByHeader[header];
    const headerColumns = arrayHeaders.includes(header)
      ? getLanguageSuffixedArrayColumns(header, translatedValue, languages)
      : getLanguageSuffixedColumns(header, translatedValue, languages);
    Object.assign(columns, headerColumns);
  });
  return columns;
}

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

export const OccupationGroupTranslatableHeaders = [
  HEADER_NAMES.PREFERREDLABEL,
  HEADER_NAMES.ALTLABELS,
  HEADER_NAMES.DESCRIPTION,
] as const;

export type OccupationGroupTranslatableHeader = (typeof OccupationGroupTranslatableHeaders)[number];

export const getOccupationGroupExportHeaders = makeGetExportHeaders(
  OccupationGroupImportHeaders,
  OccupationGroupTranslatableHeaders
);

/*
 * Interface for the occupationGroup row in the CSV file
 */
export const OCCUPATION_GROUP_NON_LOCALIZABLE_HEADERS = [
  "ID",
  "ORIGINURI",
  "UUIDHISTORY",
  "CODE",
  "GROUPTYPE",
] as const;
export const OCCUPATION_GROUP_LOCALIZABLE_FIELDS = ["PREFERREDLABEL", "ALTLABELS", "DESCRIPTION"] as const;

export interface IOccupationGroupImportRow extends LocalizedColumns<"PREFERREDLABEL" | "ALTLABELS" | "DESCRIPTION"> {
  ID: string;
  ORIGINURI: string;
  UUIDHISTORY: string;
  CODE: string;
  PREFERREDLABEL: string;
  ALTLABELS: string;
  DESCRIPTION: string;
  GROUPTYPE: CSVObjectTypes.ISCOGroup | CSVObjectTypes.LocalGroup;
}

export type IOccupationGroupExportRow = ExportRow<
  OccupationGroupTranslatableHeader,
  {
    ID: string;
    ORIGINURI: string;
    UUIDHISTORY: string;
    CODE: string;
    GROUPTYPE: CSVObjectTypes.ISCOGroup | CSVObjectTypes.LocalGroup;
    CREATEDAT: string;
    UPDATEDAT: string;
  }
>;

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

export const skillTranslatableHeaders = [
  "DEFINITION",
  "SCOPENOTE",
  HEADER_NAMES.PREFERREDLABEL,
  HEADER_NAMES.ALTLABELS,
  HEADER_NAMES.DESCRIPTION,
] as const;

export type SkillTranslatableHeader = (typeof skillTranslatableHeaders)[number];

export const getSkillExportHeaders = makeGetExportHeaders(skillImportHeaders, skillTranslatableHeaders);

/*
 * Interface for the skill row in the CSV file
 */
export const SKILL_NON_LOCALIZABLE_HEADERS = [
  "ID",
  "ORIGINURI",
  "UUIDHISTORY",
  "REUSELEVEL",
  "SKILLTYPE",
  "ISLOCALIZED",
] as const;
export const SKILL_LOCALIZABLE_FIELDS = [
  "PREFERREDLABEL",
  "ALTLABELS",
  "DESCRIPTION",
  "DEFINITION",
  "SCOPENOTE",
] as const;

export interface ISkillImportRow
  extends LocalizedColumns<"PREFERREDLABEL" | "ALTLABELS" | "DESCRIPTION" | "DEFINITION" | "SCOPENOTE"> {
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

export type ISkillExportRow = ExportRow<
  SkillTranslatableHeader,
  {
    ID: string;
    ORIGINURI: string;
    UUIDHISTORY: string;
    REUSELEVEL: CSVReuseLevel;
    SKILLTYPE: CSVSkillType;
    CREATEDAT: string;
    UPDATEDAT: string;
    ISLOCALIZED: string;
  }
>;

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

export const skillGroupTranslatableHeaders = [
  "SCOPENOTE",
  HEADER_NAMES.PREFERREDLABEL,
  HEADER_NAMES.ALTLABELS,
  HEADER_NAMES.DESCRIPTION,
] as const;

export type SkillGroupTranslatableHeader = (typeof skillGroupTranslatableHeaders)[number];

export const getSkillGroupExportHeaders = makeGetExportHeaders(skillGroupImportHeaders, skillGroupTranslatableHeaders);

/*
 * Interface for the skillGroup row in the CSV file
 */
export const SKILL_GROUP_NON_LOCALIZABLE_HEADERS = ["ID", "ORIGINURI", "UUIDHISTORY", "CODE"] as const;
export const SKILL_GROUP_LOCALIZABLE_FIELDS = ["PREFERREDLABEL", "ALTLABELS", "DESCRIPTION", "SCOPENOTE"] as const;

export interface ISkillGroupImportRow
  extends LocalizedColumns<"PREFERREDLABEL" | "ALTLABELS" | "DESCRIPTION" | "SCOPENOTE"> {
  ID: string;
  ORIGINURI: string;
  UUIDHISTORY: string;
  CODE: string;
  PREFERREDLABEL: string;
  ALTLABELS: string;
  DESCRIPTION: string;
  SCOPENOTE: string;
}

export type ISkillGroupExportRow = ExportRow<
  SkillGroupTranslatableHeader,
  {
    ID: string;
    ORIGINURI: string;
    UUIDHISTORY: string;
    CODE: string;
    CREATEDAT: string;
    UPDATEDAT: string;
  }
>;

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

export const occupationTranslatableHeaders = [
  "DEFINITION",
  "SCOPENOTE",
  "REGULATEDPROFESSIONNOTE",
  HEADER_NAMES.PREFERREDLABEL,
  HEADER_NAMES.ALTLABELS,
  HEADER_NAMES.DESCRIPTION,
] as const;

export type OccupationTranslatableHeader = (typeof occupationTranslatableHeaders)[number];

export const getOccupationExportHeaders = makeGetExportHeaders(occupationImportHeaders, occupationTranslatableHeaders);

/*
 * Interface for the occupations row in the CSV file
 */
export const OCCUPATION_NON_LOCALIZABLE_HEADERS = [
  "ID",
  "ORIGINURI",
  "UUIDHISTORY",
  "OCCUPATIONGROUPCODE",
  "CODE",
  "OCCUPATIONTYPE",
  "ISLOCALIZED",
] as const;
export const OCCUPATION_LOCALIZABLE_FIELDS = [
  "PREFERREDLABEL",
  "ALTLABELS",
  "DESCRIPTION",
  "DEFINITION",
  "SCOPENOTE",
  "REGULATEDPROFESSIONNOTE",
] as const;

export interface IOccupationImportRow
  extends LocalizedColumns<
    "PREFERREDLABEL" | "ALTLABELS" | "DESCRIPTION" | "DEFINITION" | "SCOPENOTE" | "REGULATEDPROFESSIONNOTE"
  > {
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

export type IOccupationExportRow = ExportRow<
  OccupationTranslatableHeader,
  {
    ID: string;
    ORIGINURI: string;
    UUIDHISTORY: string;
    OCCUPATIONGROUPCODE: string;
    CODE: string;
    OCCUPATIONTYPE: CSVObjectTypes.ESCOOccupation | CSVObjectTypes.LocalOccupation;
    ISLOCALIZED: string;
    CREATEDAT: string;
    UPDATEDAT: string;
  }
>;

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
