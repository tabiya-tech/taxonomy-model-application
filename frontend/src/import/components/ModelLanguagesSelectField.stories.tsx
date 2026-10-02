import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import ModelLanguagesSelectField, {
  LanguagesSource,
  ModelLanguagesSelectFieldProps,
} from "./ModelLanguagesSelectField";

// keep the selection in a state so that the field can be interacted with in storybook
const StatefulModelLanguagesSelectField = (props: Readonly<ModelLanguagesSelectFieldProps>) => {
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(props.selectedLanguages);
  return (
    <ModelLanguagesSelectField
      {...props}
      selectedLanguages={selectedLanguages}
      notifyModelLanguagesChanged={(shortCodes) => {
        setSelectedLanguages(shortCodes);
        props.notifyModelLanguagesChanged?.(shortCodes);
      }}
    />
  );
};

const meta: Meta<typeof ModelLanguagesSelectField> = {
  title: "Import/ModelLanguagesSelectField",
  component: ModelLanguagesSelectField,
  tags: ["autodocs"],
  argTypes: { notifyModelLanguagesChanged: { action: "notifyModelLanguagesChanged" } },
  render: (args) => <StatefulModelLanguagesSelectField {...args} />,
};

export default meta;
type Story = StoryObj<typeof ModelLanguagesSelectField>;

export const NoModelInfoFileSelected: Story = {
  args: {
    selectedLanguages: ["en"],
    source: LanguagesSource.DEFAULT,
  },
};

export const MultiLanguageModelInfoFile: Story = {
  args: {
    selectedLanguages: ["en", "fr", "am"],
    source: LanguagesSource.MODEL_INFO,
  },
};

export const LegacyModelInfoFile: Story = {
  args: {
    selectedLanguages: ["en"],
    source: LanguagesSource.LEGACY_MODEL_INFO,
  },
};

export const NoLanguageSelected: Story = {
  args: {
    selectedLanguages: [],
    source: LanguagesSource.MODEL_INFO,
  },
};
