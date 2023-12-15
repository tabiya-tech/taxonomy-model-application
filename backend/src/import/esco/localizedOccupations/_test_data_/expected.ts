import { OccupationType } from "esco/common/objectTypes";
import { INewLocalizedOccupationSpec } from "esco/localizedOccupation/localizedOccupation.types";

export const expected: Omit<INewLocalizedOccupationSpec, "modelId">[] = [
  {
    altLabels: ["Label1", "Label2"],
    description: "description",
    importId: "key_1",
    localizesOccupationId: "mapped_key_201",
    occupationType: OccupationType.LOCALIZED,
    UUIDHistory: ["b69710e0-7e7d-43ea-a645-26dab12faf8d", "b69710e0-7e7d-43ea-a645-26dab12faf83"],
  },
  {
    altLabels: [],
    description: "",
    importId: "key_3",
    localizesOccupationId: "mapped_key_203",
    occupationType: OccupationType.LOCALIZED,
    UUIDHistory: ["b69710e0-7e7d-43ea-a645-26dab12faf8d", "b69710e0-7e7d-43ea-a645-26dab12faf83"],
  },
  {
    altLabels: ["Label13", "Label14"],
    description: "",
    importId: "key_7",
    localizesOccupationId: "mapped_key_207",
    occupationType: OccupationType.LOCALIZED,
    UUIDHistory: ["b69710e0-7e7d-43ea-a645-26dab12faf83", "b69710e0-7e7d-43ea-a645-26dab12faf8d"],
  },
  {
    altLabels: ["Label15", "Label16"],
    description: "description\nwith\nlinebreak",
    importId: "key_8",
    localizesOccupationId: "mapped_key_208",
    occupationType: OccupationType.LOCALIZED,
    UUIDHistory: ["b69710e0-7e7d-43ea-a645-26dab12faf8d"],
  },
  {
    altLabels: ["Label17", "Label18"],
    description: "",
    importId: "key_9",
    localizesOccupationId: "mapped_key_209",
    occupationType: OccupationType.LOCALIZED,
    UUIDHistory: [],
  },
  {
    altLabels: ["Label19", "Label20"],
    description: "",
    importId: "key_10",
    localizesOccupationId: "mapped_key_210",
    occupationType: OccupationType.LOCALIZED,
    UUIDHistory: [],
  },
];
