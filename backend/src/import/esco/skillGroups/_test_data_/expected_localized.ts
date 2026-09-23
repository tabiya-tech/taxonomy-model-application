import { INewSkillGroupSpecLocalized } from "esco/skillGroup/_shared/skillGroup.types";
import { ITranslatedStringDoc, ITranslatedStringArrayDoc } from "common/language/translatedString.types";
import LanguageAPISpecs from "api-specifications/language";

const en = "en" as LanguageAPISpecs.Types.LanguageDbKeyName;
const fr = "fr" as LanguageAPISpecs.Types.LanguageDbKeyName;

const toTranslatedString = (enValue: string, frValue: string): ITranslatedStringDoc =>
  new Map([
    [en, enValue],
    [fr, frValue],
  ]);

const toTranslatedStringArray = (enValues: string[], frValues: string[]): ITranslatedStringArrayDoc =>
  enValues.map(
    (v, i) =>
      new Map([
        [en, v],
        [fr, frValues[i] ?? ""],
      ])
  );

export const expected: Omit<INewSkillGroupSpecLocalized, "modelId">[] = [
  {
    originUri: "origin uri 1",
    UUIDHistory: ["b69710e0-7e7d-43ea-a645-26dab12faf8d"],
    code: "L",
    preferredLabel: toTranslatedString("preferred label EN", "preferred label FR"),
    altLabels: toTranslatedStringArray(
      ["label1", "label2", "preferred label EN"],
      ["label1 FR", "label2 FR", "preferred label FR"]
    ),
    description: toTranslatedString("description EN", "description FR"),
    scopeNote: toTranslatedString("scope note EN", "scope note FR"),
    importId: "key_1",
  },
  {
    originUri: "origin uri 2",
    UUIDHistory: ["b69710e0-7e7d-43ea-a645-26dab12faf8e"],
    code: "L6.6.6",
    preferredLabel: toTranslatedString("preferred label 2 EN", "preferred label 2 FR"),
    altLabels: toTranslatedStringArray(
      ["alt1 EN", "alt2 EN", "preferred label 2 EN"],
      ["alt1 FR", "alt2 FR", "preferred label 2 FR"]
    ),
    description: toTranslatedString("description 2 EN", "description 2 FR"),
    scopeNote: toTranslatedString("scope note 2 EN", "scope note 2 FR"),
    importId: "key_2",
  },
];
