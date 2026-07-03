import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Routes, Route } from "react-router-dom";
import ExplorerPage from "./ExplorerPage";
import { DATA_TEST_ID as TREE_PANEL_DATA_TEST_ID } from "src/explorer/components/ExplorerTreePanel/ExplorerTreePanel";
import * as MockPayload from "src/modelInfo/_test_utilities/mockModelInfoPayload";
import { ObjectType } from "src/explorer/explorer.types";
import { getApiUrl } from "src/envService";
import { routerPaths } from "src/app/routerPaths";

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
