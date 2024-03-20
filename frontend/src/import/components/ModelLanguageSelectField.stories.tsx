import { Meta, StoryObj } from "@storybook/react";
import ModelLanguageSelectField, { languageEnum } from "./ModelLanguageSelectField";

const meta: Meta<typeof ModelLanguageSelectField> = {
  title: "Import/ModelLanguageSelectField",
  component: ModelLanguageSelectField,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof ModelLanguageSelectField>;

export const Shown: Story = {
  args: {
    languages: [languageEnum.ENGLISH, languageEnum.FRENCH],
  },
};
