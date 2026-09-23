import { INewSkillGroupSpecLocalized } from "esco/skillGroup/_shared/skillGroup.types";
import { ITranslatedStringDoc, ITranslatedStringArrayDoc } from "common/language/translatedString.types";
import LanguageAPISpecs from "api-specifications/language";

const en = "en" as LanguageAPISpecs.Types.LanguageDbKeyName;
const toTranslatedString = (value: string): ITranslatedStringDoc => new Map([[en, value]]);
const toTranslatedStringArray = (values: string[]): ITranslatedStringArrayDoc => values.map((v) => new Map([[en, v]]));

export const expected: Omit<INewSkillGroupSpecLocalized, "modelId">[] = [
  {
    originUri: "origin uri",
    UUIDHistory: ["b69710e0-7e7d-43ea-a645-26dab12faf8d", "b69710e0-7e7d-43ea-a645-26dab12faf83"],
    code: "L",
    preferredLabel: toTranslatedString("preferred label"),
    altLabels: toTranslatedStringArray(["label1", "label2", "preferred label"]),
    description: toTranslatedString("description"),
    scopeNote: toTranslatedString("scopeNote"),
    importId: "key_1",
  },
  {
    originUri: "origin\nuri\nwith\nlinebreak",
    UUIDHistory: ["b69710e0-7e7d-43ea-a645-26dab12faf8d"],
    code: "L6.6.6",
    preferredLabel: toTranslatedString("preferred\nlabel\nwith\nlinebreak"),
    altLabels: toTranslatedStringArray(["label1", "label2"]),
    description: toTranslatedString("description\nwith\nlinebreak"),
    scopeNote: toTranslatedString("scopeNote\nwith\nlinebreak"),
    importId: "key_2",
  },
  {
    originUri: "",
    UUIDHistory: [],
    code: "",
    preferredLabel: toTranslatedString(""),
    altLabels: toTranslatedStringArray([]),
    description: toTranslatedString(""),
    scopeNote: toTranslatedString(""),
    importId: "key_3",
  },
  {
    originUri: "origin uri",
    UUIDHistory: [],
    code: "L",
    preferredLabel: toTranslatedString("preferred label"),
    altLabels: toTranslatedStringArray(["label1", "label2", "preferred label"]),
    description: toTranslatedString("description"),
    scopeNote: toTranslatedString("scopeNote"),
    importId: "key_4",
  },
  {
    originUri: "origin uri",
    UUIDHistory: [],
    code: "L",
    preferredLabel: toTranslatedString("preferred label"),
    altLabels: toTranslatedStringArray(["label1", "label2", "preferred label"]),
    description: toTranslatedString("description"),
    scopeNote: toTranslatedString("scopeNote"),
    importId: "key_5",
  },
  {
    originUri: "origin uri",
    UUIDHistory: ["b69710e0-7e7d-43ea-a645-26dab12faf8d", "b69710e0-7e7d-43ea-a645-26dab12faf56"],
    code: "L",
    preferredLabel: toTranslatedString("duplicate altLabels"),
    altLabels: toTranslatedStringArray(["label1", "label2", "duplicate altLabels"]),
    description: toTranslatedString("description"),
    scopeNote: toTranslatedString("scopeNote"),
    importId: "key_6",
  },
];
