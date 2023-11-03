import { INewOccupationSpec, OccupationType } from "esco/occupation/occupation.types";

export const expected: Omit<INewOccupationSpec, "modelId">[] = [
  {
    ESCOUri: "esco uri",
    originUUID: "origin uuid",
    ISCOGroupCode: "01",
    code: "0001.1.2.3_01",
    preferredLabel: "preferred label",
    altLabels: ["label1", "label2"],
    description: "description",
    definition: "definition",
    scopeNote: "scope note",
    regulatedProfessionNote: "regulated profession note",
    importId: "key_1",
    occupationType: OccupationType.LOCAL,
  },
  {
    ESCOUri: "esco\nuri\nwith\nlinebreak",
    originUUID: "origin\nuuid\nwith\nlinebreak",
    ISCOGroupCode: "0101",
    code: "0101.01.02.03_01", //NOSONAR
    preferredLabel: "preferred\nlabel\nwith\nlinebreak",
    altLabels: ["label1", "label2"],
    description: "description\nwith\nlinebreak",
    definition: "definition\nwith\nlinebreak",
    scopeNote: "scope\nnote\nwith\nlinebreak",
    regulatedProfessionNote: "regulated\nprofession\nnote\nwith\nlinebreak",
    importId: "key_2",
    occupationType: OccupationType.LOCAL,
  },
];
