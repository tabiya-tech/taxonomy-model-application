import type { Meta, StoryObj } from "@storybook/react";
import AvailableLanguages from "./AvailableLanguages";
import LanguageAPISpecs from "api-specifications/language";

const meta: Meta<typeof AvailableLanguages> = {
  title: "ModelDirectory/AvailableLanguages",
  component: AvailableLanguages,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof AvailableLanguages>;

export const SingleLanguage: Story = {
  args: {
    availableLanguages: ["en"],
  },
};

export const MultipleLanguages: Story = {
  args: {
    availableLanguages: ["en", "am", "fr"],
  },
};

export const WithLabel: Story = {
  args: {
    availableLanguages: ["en", "fr"],
    showLabel: true,
  },
};

export const WithLabelSingleLanguage: Story = {
  args: {
    availableLanguages: ["en"],
    showLabel: true,
  },
};

export const AllRegistryLanguages: Story = {
  args: {
    availableLanguages: LanguageAPISpecs.Constants.Languages.map((language) => language.shortCode),
  },
};
