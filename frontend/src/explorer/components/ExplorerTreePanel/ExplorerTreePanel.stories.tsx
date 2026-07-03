import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import ExplorerTreePanel, { ExplorerTreeItem } from "./ExplorerTreePanel";

const SKILLS: ExplorerTreeItem[] = [
  {
    id: "S1",
    code: "S1",
    title: "Communication, collaboration and creativity",
    objectType: "skillgroup",
    hasChildren: false,
  },
  {
    id: "S2",
    code: "S2",
    title: "Information skills",
    objectType: "skillgroup",
    hasChildren: true,
    children: [
      {
        id: "S2.1",
        code: "S2.1",
        title: "use information systems",
        objectType: "skillgroup",
        hasChildren: true,
        children: [
          {
            id: "S2.1.1",
            code: "S2.1.1",
            title: "use electronic health records",
            objectType: "skill",
            hasChildren: false,
          },
          {
            id: "S2.1.2",
            code: "S2.1.2",
            title: "use laboratory information systems",
            objectType: "skill",
            hasChildren: false,
          },
        ],
      },
      { id: "S2.2.0", code: "S2.2.0", title: "manage patient records", objectType: "skill", hasChildren: false },
    ],
  },
  { id: "S3.0.1", code: "S3.0.1", title: "provide patient care", objectType: "skill", hasChildren: false },
  { id: "L.1", code: "L.1", title: "English proficiency", objectType: "skill", hasChildren: false },
];

const OCCUPATIONS: ExplorerTreeItem[] = [
  {
    id: "0.1",
    code: "0.1",
    title: "Commissioned Armed Forces Officer",
    objectType: "escooccupation",
    hasChildren: false,
  },
  {
    id: "0.2",
    code: "0.2",
    title: "Non-commissioned Armed Forces Officer",
    objectType: "escooccupation",
    hasChildren: false,
  },
  {
    id: "1",
    code: "1",
    title: "Managers",
    objectType: "iscogroup",
    hasChildren: true,
    children: [
      {
        id: "11",
        code: "11",
        title: "Chief Executives and Senior Officials",
        objectType: "iscogroup",
        hasChildren: false,
      },
      {
        id: "12",
        code: "12",
        title: "Administrative and Commercial Managers",
        objectType: "iscogroup",
        hasChildren: false,
      },
    ],
  },
  {
    id: "2",
    code: "2",
    title: "Professionals",
    objectType: "iscogroup",
    hasChildren: true,
    children: [
      {
        id: "22",
        code: "22",
        title: "Health Professionals",
        objectType: "iscogroup",
        hasChildren: true,
        children: [
          { id: "221", code: "221", title: "Medical Doctors", objectType: "escooccupation", hasChildren: false },
          { id: "222", code: "222", title: "Nursing Professionals", objectType: "escooccupation", hasChildren: false },
        ],
      },
      { id: "23", code: "23", title: "Teaching Professionals", objectType: "iscogroup", hasChildren: false },
    ],
  },
];

const meta: Meta<typeof ExplorerTreePanel> = {
  title: "Explorer/Components/ExplorerTreePanel",
  component: ExplorerTreePanel,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;

type Story = StoryObj<typeof ExplorerTreePanel>;

const SkillsStory = () => {
  const [activeTab, setActiveTab] = useState<"occupations" | "skills">("skills");
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>(undefined);
  const [searchValue, setSearchValue] = useState("");
  return (
    <div style={{ height: "600px", width: "350px" }}>
      <ExplorerTreePanel
        activeTab={activeTab}
        onTabChange={setActiveTab}
        items={activeTab === "skills" ? SKILLS : OCCUPATIONS}
        selectedItemId={selectedItemId}
        onSelectItem={(item) => setSelectedItemId(item.id)}
        onExpandItem={() => {}}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
      />
    </div>
  );
};

export const Shown: Story = {
  render: () => <SkillsStory />,
};

export const Loading: Story = {
  render: () => (
    <div style={{ height: "600px", width: "350px" }}>
      <ExplorerTreePanel
        activeTab="occupations"
        onTabChange={() => {}}
        items={[]}
        onSelectItem={() => {}}
        onExpandItem={() => {}}
        searchValue=""
        onSearchChange={() => {}}
        isLoading={true}
      />
    </div>
  ),
};

export const Empty: Story = {
  render: () => (
    <div style={{ height: "600px", width: "350px" }}>
      <ExplorerTreePanel
        activeTab="occupations"
        onTabChange={() => {}}
        items={[]}
        onSelectItem={() => {}}
        onExpandItem={() => {}}
        searchValue=""
        onSearchChange={() => {}}
      />
    </div>
  ),
};
