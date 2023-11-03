import { OccupationType } from "esco/common/objectTypes";
import { INewLocalizedOccupationSpec } from "esco/localizedOccupation/localizedOccupation.types";

export const expected: Omit<INewLocalizedOccupationSpec, "modelId">[] = [
  {
    altLabels: ["Label1", "Label2"],
    description: "description",
    importId: "key_1",
    localizesOccupationId: "mapped_key_201",
    occupationType: OccupationType.LOCALIZED,
  },
  {
    altLabels: [],
    description: "",
    importId: "key_3",
    localizesOccupationId: "mapped_key_203",
    occupationType: OccupationType.LOCALIZED,
  },
  {
    altLabels: ["Label13", "Label14"],
    description: "",
    importId: "key_7",
    localizesOccupationId: "mapped_key_207",
    occupationType: OccupationType.LOCALIZED,
  },
  {
    altLabels: ["Label15", "Label16"],
    description: "description\nwith\nlinebreak",
    importId: "key_8",
    localizesOccupationId: "mapped_key_208",
    occupationType: OccupationType.LOCALIZED,
  },
];
