export const expected = [
  {
    ESCOUri: "",
    originUUID: "",
    code: "",
    preferredLabel: "",
    altLabels: [],
    description: "",
    scopeNote: ""
  },
  {
    ESCOUri: "",
    originUUID: "",
    code: "",
    preferredLabel: "",
    altLabels: [],
    description: "",
    scopeNote: ""
  },
  {
    ESCOUri: "esco uri",
    originUUID: "origin uuid",
    code: "L",
    preferredLabel: "preferred label",
    altLabels: ["label1", "label2"],
    description: "description",
    scopeNote: "scopeNote"
  },
  {
    ESCOUri: "esco\n" +
      "uri\n" +
      "with\n" +
      "linebreak",
    originUUID: "origin\n" +
      "uuid\n" +
      "with\n" +
      "linebreak",
      code: "L6.6.6",
    preferredLabel: "preferred\n" +
      "label\n" +
      "with\n" +
      "linebreak",
    altLabels: ["label1", "label2"],
    description: "description\n" +
      "with\n" +
      "linebreak",
    scopeNote: "scopeNote\n" +
      "with\n" +
      "linebreak"
  }
];