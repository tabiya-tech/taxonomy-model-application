import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Routes, Route } from "react-router-dom";
import ExplorerPage from "./ExplorerPage";
import { DATA_TEST_ID as TREE_PANEL_DATA_TEST_ID } from "src/explorer/components/ExplorerTreePanel/ExplorerTreePanel";
import * as MockPayload from "src/modelInfo/_test_utilities/mockModelInfoPayload";
import { ObjectType } from "src/explorer/explorer.types";
import { getApiUrl } from "src/envService";
import { routerPaths } from "src/app/routerPaths";
import { useLanguage } from "src/language/LanguageProvider";
import { DEFAULT_LANGUAGE } from "src/language/languages.service";

const MODELS_URL = getApiUrl() + "/models";

const fakeModels = MockPayload.GET.getPayloadWithArrayOfFakeModelInfo(2);
fakeModels[0] = { ...fakeModels[0], name: "Taxonomy for South Africa", version: "v1.0.0" };
fakeModels[1] = { ...fakeModels[1], name: "Taxonomy for South Africa", version: "v0.0.1" };

const modelId = fakeModels[0].id;
const modelUrl = `${getApiUrl()}/models/${modelId}`;

const paginated = <T,>(data: T[]) => ({ data, limit: 100, nextCursor: null });

// --- Occupations tab fixtures ---
const occupationGroupsRoot = [
  {
    id: "grp-0",
    UUID: "grp-0-uuid",
    code: "0",
    preferredLabel: "Armed forces occupations",
    description: "Armed forces occupations include ...",
    altLabels: [],
    groupType: ObjectType.ISCOGroup,
    children: [],
  },
  {
    id: "grp-1",
    UUID: "grp-1-uuid",
    code: "1",
    preferredLabel: "Managers",
    description: "Managers plan, direct, coordinate ...",
    altLabels: ["executive managers"],
    groupType: ObjectType.ISCOGroup,
    children: [
      {
        id: "grp-11",
        code: "11",
        preferredLabel: "Chief Executives and Senior Officials",
        objectType: ObjectType.ISCOGroup,
      },
      {
        id: "occ-1120",
        code: "1120",
        preferredLabel: "Business services managers",
        objectType: ObjectType.ESCOOccupation,
      },
    ],
  },
];
const occupationGroup11Children = [
  {
    id: "occ-1113",
    code: "1113",
    preferredLabel: "Senior government officials",
    objectType: ObjectType.ESCOOccupation,
  },
];
const occupation1120Detail = {
  id: "occ-1120",
  UUID: "occ-1120-uuid",
  code: "1120",
  preferredLabel: "Business services managers",
  definition: "Business services managers plan, direct and coordinate the delivery of business services.",
  altLabels: ["business services manager", "commercial services manager"],
  occupationType: ObjectType.ESCOOccupation,
  occupationGroupCode: "112",
  regulatedProfessionNote: "",
  requiresSkills: [
    { id: "skill-s1.2.0", preferredLabel: "communicate effectively in healthcare", relationType: "essential" },
    { id: "skill-s2.1.0", preferredLabel: "manage business operations", relationType: "essential" },
    { id: "skill-s1.1.0", preferredLabel: "work in healthcare teams", relationType: "optional" },
  ],
};

const occupationSearchResults = [
  {
    id: "occ-1120",
    UUID: "occ-1120-uuid",
    code: "1120",
    preferredLabel: "Business services managers",
    description: "Plan, direct and coordinate the delivery of business services.",
    altLabels: ["business services manager"],
    occupationType: ObjectType.ESCOOccupation,
  },
];

// --- Skills tab fixtures ---
const skillGroupsRoot = [
  {
    id: "grp-s1",
    code: "S1",
    preferredLabel: "Communication, collaboration and creativity",
    description: "Skills related to communication, collaboration and creativity.",
    children: [
      {
        id: "skill-s1.2.0",
        code: "S1.2.0",
        preferredLabel: "communicate effectively in healthcare",
        objectType: ObjectType.Skill,
      },
      { id: "skill-s1.1.0", code: "S1.1.0", preferredLabel: "work in healthcare teams", objectType: ObjectType.Skill },
    ],
  },
  {
    id: "grp-s2",
    code: "S2",
    preferredLabel: "Information skills",
    description: "Skills related to using and managing information.",
    children: [],
  },
];
const skillS120Detail = {
  id: "skill-s1.2.0",
  UUID: "skill-s1.2.0-uuid",
  preferredLabel: "communicate effectively in healthcare",
  definition: "Communicate clearly and empathetically with patients, families and colleagues across the care process.",
  altLabels: ["healthcare communication"],
  skillType: "skill/competence",
  reuseLevel: "sector-specific",
  requiredByOccupations: [{ id: "occ-1120", preferredLabel: "Business services managers", relationType: "essential" }],
};
const skillSearchResults = [
  {
    id: "skill-s1.2.0",
    UUID: "skill-s1.2.0-uuid",
    preferredLabel: "communicate effectively in healthcare",
    description: "Communicate clearly and empathetically with patients, families and colleagues.",
    altLabels: ["healthcare communication"],
  },
];

// Disable switching tabs
const disableTabsDecorator = (Story: () => React.ReactElement) => (
  <>
    <style>{`[data-testid="${TREE_PANEL_DATA_TEST_ID.EXPLORER_TREE_PANEL_TABS}"] { pointer-events: none; opacity: 0.5; }`}</style>
    <Story />
  </>
);

const meta: Meta<typeof ExplorerPage> = {
  title: "Explorer/ExplorerPage",
  component: ExplorerPage,
  tags: ["autodocs"],
  decorators: [disableTabsDecorator],
  parameters: {
    mockData: [
      {
        url: MODELS_URL,
        method: "GET",
        status: 200,
        response: fakeModels,
      },
      {
        url: `${modelUrl}/occupationGroups?root=true&limit=100`,
        method: "GET",
        status: 200,
        response: paginated(occupationGroupsRoot),
      },
      {
        url: `${modelUrl}/occupationGroups/grp-11/children?limit=100`,
        method: "GET",
        status: 200,
        response: paginated(occupationGroup11Children),
      },
      {
        url: `${modelUrl}/occupations/occ-1120`,
        method: "GET",
        status: 200,
        response: occupation1120Detail,
      },
      {
        url: `${modelUrl}/occupations?query=business&searchFields=preferredLabel,altLabels,description&limit=100`,
        method: "GET",
        status: 200,
        response: paginated(occupationSearchResults),
      },
      {
        url: `${modelUrl}/skillGroups?root=true&limit=100`,
        method: "GET",
        status: 200,
        response: paginated(skillGroupsRoot),
      },
      {
        url: `${modelUrl}/skills/skill-s1.2.0`,
        method: "GET",
        status: 200,
        response: skillS120Detail,
      },
      {
        url: `${modelUrl}/skills?query=communicate&searchFields=preferredLabel,altLabels,description&limit=100`,
        method: "GET",
        status: 200,
        response: paginated(skillSearchResults),
      },
    ],
  },
};

export default meta;

type Story = StoryObj<typeof ExplorerPage>;

export const Occupations: Story = {
  parameters: {
    initialEntries: [`/explorer/${fakeModels[0].id}/occupations`],
  },
  render: () => (
    <Routes>
      <Route path={routerPaths.EXPLORER_OCCUPATIONS} element={<ExplorerPage initialTab="occupations" />} />
      <Route path={routerPaths.EXPLORER_OCCUPATIONS_DETAIL} element={<ExplorerPage initialTab="occupations" />} />
    </Routes>
  ),
};

export const Skills: Story = {
  parameters: {
    initialEntries: [`/explorer/${fakeModels[0].id}/skills`],
  },
  render: () => (
    <Routes>
      <Route path={routerPaths.EXPLORER_SKILLS} element={<ExplorerPage initialTab="skills" />} />
      <Route path={routerPaths.EXPLORER_SKILLS_DETAIL} element={<ExplorerPage initialTab="skills" />} />
    </Routes>
  ),
};

// --- Multilingual model ---
const multilingualModels = MockPayload.GET.getPayloadWithOneMultilingualModelInfo();
const multilingualModelUrl = `${getApiUrl()}/models/${multilingualModels[0].id}`;

const multilingualTexts: Record<string, { group: string; occupation: string; definition: string; skill: string }> = {
  en: {
    group: "Managers",
    occupation: "Business services managers",
    definition: "Business services managers plan, direct and coordinate the delivery of business services.",
    skill: "manage budgets",
  },
  fr: {
    group: "Directeurs et cadres de direction",
    occupation: "Directeurs des services aux entreprises",
    definition:
      "Les directeurs des services aux entreprises planifient, dirigent et coordonnent la prestation de services.",
    skill: "gérer des budgets",
  },
  es: {
    group: "Directores y gerentes",
    occupation: "Directores de servicios empresariales",
    definition: "Los directores de servicios empresariales planifican, dirigen y coordinan la prestación de servicios.",
    skill: "gestionar presupuestos",
  },
};

// The mock addon does not pass the request headers to a response function, so the Accept-Language sent by the
// explorer cannot be read there. The selected language is captured from the language context instead.
let selectedLanguage = DEFAULT_LANGUAGE;
const CaptureSelectedLanguage = ({ children }: { children: React.ReactNode }) => {
  selectedLanguage = useLanguage().language;
  return <>{children}</>;
};
const texts = () => multilingualTexts[selectedLanguage] ?? multilingualTexts[DEFAULT_LANGUAGE];

const multilingualGroup = () => ({
  id: "grp-1",
  UUID: "grp-1-uuid",
  code: "1",
  preferredLabel: texts().group,
  altLabels: [],
  groupType: ObjectType.ISCOGroup,
  children: [
    { id: "occ-1120", code: "1120", preferredLabel: texts().occupation, objectType: ObjectType.ESCOOccupation },
  ],
});

// Opens on an occupation in French. Switch the language from the header to see the taxonomy's data change.
export const MultilingualModel: Story = {
  decorators: [
    (Story) => (
      <CaptureSelectedLanguage>
        <Story />
      </CaptureSelectedLanguage>
    ),
  ],
  parameters: {
    initialEntries: [`/explorer/${multilingualModels[0].id}/occupations/occ-1120?lang=fr`],
    mockData: [
      { url: MODELS_URL, method: "GET", status: 200, response: multilingualModels },
      {
        url: `${multilingualModelUrl}/occupationGroups?root=true&limit=100`,
        method: "GET",
        status: 200,
        response: () => paginated([multilingualGroup()]),
      },
      {
        url: `${multilingualModelUrl}/occupationGroups/grp-1`,
        method: "GET",
        status: 200,
        response: () => multilingualGroup(),
      },
      {
        url: `${multilingualModelUrl}/occupations/occ-1120`,
        method: "GET",
        status: 200,
        response: () => ({
          id: "occ-1120",
          UUID: "occ-1120-uuid",
          code: "1120",
          preferredLabel: texts().occupation,
          definition: texts().definition,
          altLabels: [],
          occupationType: ObjectType.ESCOOccupation,
          requiresSkills: [{ id: "skill-1", preferredLabel: texts().skill, relationType: "essential" }],
        }),
      },
    ],
  },
  render: () => (
    <Routes>
      <Route path={routerPaths.EXPLORER_OCCUPATIONS} element={<ExplorerPage initialTab="occupations" />} />
      <Route path={routerPaths.EXPLORER_OCCUPATIONS_DETAIL} element={<ExplorerPage initialTab="occupations" />} />
    </Routes>
  ),
};
