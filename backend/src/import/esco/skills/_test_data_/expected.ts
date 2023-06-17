export const expected = [
  {
    ESCOUri: "",
    originUUID: "",
    preferredLabel: "",
    altLabels: [],
    description: "",
    scopeNote: "",
    definition: "",
    skillType: "",
    reuseLevel: "",
  },
  {
    ESCOUri: "",
    originUUID: "",
    preferredLabel: "",
    altLabels: [],
    description: "",
    scopeNote: "",
    definition: "",
    skillType: "",
    reuseLevel: "",
  },
  {
    ESCOUri: "esco uri",
    originUUID: "origin uuid",
    preferredLabel: "preferred label",
    altLabels: ["label1", "label2"],
    description: "description",
    scopeNote: "scopeNote",
    definition: "definition",
    skillType: "skill/competence",
    reuseLevel: "sector-specific",
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
    preferredLabel: "preferred\n" +
      "label\n" +
      "with\n" +
      "linebreak",
    altLabels: ["label1", "label2"],
    description: "description\n" +
      "with\n" +
      "linebreak",
    definition: "definition\n" +
      "with\n" +
      "linebreak",
    scopeNote: "scopeNote\n" +
      "with\n" +
      "linebreak",
    skillType: "knowledge",
    reuseLevel: "cross-sector",
  }
];