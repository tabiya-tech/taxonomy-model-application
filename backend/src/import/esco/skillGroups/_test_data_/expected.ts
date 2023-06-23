export const expected = [
  {
    ESCOUri: "",
    originUUID: "",
    code: "",
    preferredLabel: "",
    altLabels: [],
    description: "",
    scopeNote: "",
    importId: ""
  },
  {
    ESCOUri: "",
    originUUID: "",
    code: "",
    preferredLabel: "",
    altLabels: [],
    description: "",
    scopeNote: "",
    importId: ""
  },
  {
    ESCOUri: "esco uri",
    originUUID: "origin uuid",
    code: "L",
    preferredLabel: "preferred label",
    altLabels: ["label1", "label2"],
    description: "description",
    scopeNote: "scopeNote",
    importId: "key_1"
  },
  {
    ESCOUri: "esco\nuri\nwith\nlinebreak",
    originUUID: "origin\nuuid\nwith\nlinebreak",
    code: "L6.6.6",
    preferredLabel: "preferred\nlabel\nwith\nlinebreak",
    altLabels: ["label1", "label2"],
    description: "description\nwith\nlinebreak",
    scopeNote: "scopeNote\nwith\nlinebreak",
    importId: "key_2"
  }
];