import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import ExplorerHeader from "./ExplorerHeader";
import { getArrayOfFakeModels } from "src/modeldirectory/_test_utilities/mockModelData";

const fakeModels = getArrayOfFakeModels(3);
fakeModels[0] = { ...fakeModels[0], name: "Taxonomy for South Africa", version: "v1.0.1-rc.1" };
fakeModels[1] = { ...fakeModels[1], name: "Taxonomy for South Africa", version: "v1.0.0" };
fakeModels[2] = { ...fakeModels[2], name: "Tabiya esco-1.1.1", version: "v0.9.0" };

const meta: Meta<typeof ExplorerHeader> = {
  title: "Explorer/Components/ExplorerHeader",
  component: ExplorerHeader,
  tags: ["autodocs"],
  argTypes: {
    onModelChange: { action: "onModelChange" },
    onLanguageChange: { action: "onLanguageChange" },
  },
  args: {
    models: fakeModels,
    selectedModel: fakeModels[0],
    isLoading: false,
    language: "en",
  },
  // The header only reports the picked language, the page owns it. Keep it here, so that picking a language shows it.
  render: function Render(args) {
    const [language, setLanguage] = useState(args.language);
    return (
      <ExplorerHeader
        {...args}
        language={language}
        onLanguageChange={(pickedLanguage) => {
          setLanguage(pickedLanguage);
          args.onLanguageChange(pickedLanguage);
        }}
      />
    );
  },
};

export default meta;

type Story = StoryObj<typeof ExplorerHeader>;

export const Shown: Story = {};

export const SingleLanguage: Story = {
  args: {
    selectedModel: fakeModels[0],
    language: "en",
  },
};

export const MultiLanguage: Story = {
  args: {
    selectedModel: fakeModels[1],
    language: "en",
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
    models: [],
    selectedModel: null,
  },
};

export const NoModels: Story = {
  args: {
    isLoading: false,
    models: [],
    selectedModel: null,
  },
};
