import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import ExplorerTreePanel, { ExplorerTreeItem } from "./ExplorerTreePanel";

const SKILLS: ExplorerTreeItem[] = [
  {
    id: "S1",
    code: "S1",
    title: "Communication, collaboration and creativity",
  },
  {
    id: "S2",
    code: "S2",
    title: "Information skills",
    children: [
      {
        id: "S2.1",
        code: "S2.1",
        title: "use information systems",
        children: [
          { id: "S2.1.1", code: "S2.1.1", title: "use electronic health records" },
          { id: "S2.1.2", code: "S2.1.2", title: "use laboratory information systems" },
        ],
      },
      { id: "S2.2.0", code: "S2.2.0", title: "manage patient records" },
    ],
  },
  { id: "S3.0.1", code: "S3.0.1", title: "provide patient care" },
  { id: "L.1", code: "L.1", title: "English proficiency" },
];

const OCCUPATIONS: ExplorerTreeItem[] = [
  { id: "0.1", code: "0.1", title: "Commissioned Armed Forces Officer" },
  { id: "0.2", code: "0.2", title: "Non-commissioned Armed Forces Officer" },
  {
    id: "1",
    code: "1",
    title: "Managers",
    children: [
      { id: "11", code: "11", title: "Chief Executives and Senior Officials" },
      { id: "12", code: "12", title: "Administrative and Commercial Managers" },
    ],
  },
  {
    id: "2",
    code: "2",
    title: "Professionals",
    children: [
      {
        id: "22",
        code: "22",
        title: "Health Professionals",
        children: [
          { id: "221", code: "221", title: "Medical Doctors" },
          { id: "222", code: "222", title: "Nursing Professionals" },
        ],
      },
      { id: "23", code: "23", title: "Teaching Professionals" },
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
        searchValue=""
        onSearchChange={() => {}}
      />
    </div>
  ),
};
