import { INewOccupationGroupSpecLocalized } from "esco/occupationGroup/_shared/OccupationGroup.types";
import { ObjectTypes } from "esco/common/objectTypes";
import { ITranslatedStringDoc, ITranslatedStringArrayDoc } from "common/language/translatedString.types";
import LanguageAPISpecs from "api-specifications/language";

const en = "en" as LanguageAPISpecs.Types.LanguageDbKeyName;
const toTranslatedString = (value: string): ITranslatedStringDoc => new Map([[en, value]]);
const toTranslatedStringArray = (values: string[]): ITranslatedStringArrayDoc => values.map((v) => new Map([[en, v]]));

export const expected: Omit<INewOccupationGroupSpecLocalized, "modelId">[] = [
  {
    originUri: "origin uri",
    UUIDHistory: [],
    code: "01",
    preferredLabel: toTranslatedString("preferred label"),
    altLabels: toTranslatedStringArray(["label1", "label2", "preferred label"]),
    description: toTranslatedString("description"),
    groupType: ObjectTypes.ISCOGroup,
    importId: "key_1",
  },
  {
    originUri: "esco\nuri\nwith\nlinebreak",
    UUIDHistory: ["b69710e0-7e7d-43ea-a645-26dab12faf8d", "b69710e0-7e7d-43ea-a645-26dab12faf83"],
    code: "0101",
    preferredLabel: toTranslatedString("preferred\nlabel\nwith\nlinebreak"),
    altLabels: toTranslatedStringArray(["label1", "label2"]),
    groupType: ObjectTypes.ISCOGroup,
    description: toTranslatedString("description\nwith\nlinebreak"),
    importId: "key_2",
  },
  {
    originUri: "",
    UUIDHistory: ["632b3cac-515f-4260-b1d9-ea8674d5ded2"],
    code: "",
    preferredLabel: toTranslatedString(""),
    altLabels: toTranslatedStringArray([]),
    groupType: ObjectTypes.ISCOGroup,
    description: toTranslatedString(""),
    importId: "key_3",
  },
  {
    originUri: "origin uri",
    UUIDHistory: ["b69710e0-7e7d-43ea-a645-26dab12faf8d", "b69710e0-7e7d-43ea-a645-26dab12faf56"],
    code: "0102",
    preferredLabel: toTranslatedString("duplicate altLabels"),
    altLabels: toTranslatedStringArray(["label1", "label2", "duplicate altLabels"]),
    groupType: ObjectTypes.ISCOGroup,
    description: toTranslatedString("description"),
    importId: "key_4",
  },
  {
    originUri: "origin uri",
    UUIDHistory: ["b69710e0-7e7d-43ea-a645-26dab12faf8f"],
    code: "I0102",
    preferredLabel: toTranslatedString("not duplicate altLabels"),
    altLabels: toTranslatedStringArray(["label I0102", "not duplicate altLabels"]),
    description: toTranslatedString("description"),
    groupType: ObjectTypes.ISCOGroup,
    importId: "key_i4",
  },
  {
    originUri: "icatus urn",
    UUIDHistory: ["b69710e0-7e7d-43ea-a645-26dab12faf8g"],
    code: "I0103",
    preferredLabel: toTranslatedString("ICATUS Occupation group"),
    altLabels: toTranslatedStringArray(["label I0103"]),
    description: toTranslatedString("description"),
    groupType: ObjectTypes.LocalGroup,
    importId: "key_i5",
  },
];
